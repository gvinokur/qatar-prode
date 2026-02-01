import { vi, describe, it, expect, Mock } from 'vitest';

// Mock the auth module to prevent Next-auth import issues - must be first!
vi.mock('../../auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      emailVerified: new Date()
    }
  })
}));

// Mock web-push to prevent setVapidDetails from being called
vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn()
}));
import { 
  urlBase64ToUint8Array, 
  isNotificationSupported, 
  checkExistingSubscription,
  subscribeToNotifications,
  unsubscribeFromNotifications 
} from '../../app/utils/notifications-utils';
import * as notificationActions from '../../app/actions/notifiaction-actions';

// Mock the notification actions
vi.mock('../../app/actions/notifiaction-actions', () => ({
  subscribeUser: vi.fn(),
  unsubscribeUser: vi.fn()
}));

// Mock environment variables
const originalEnv = process.env;

describe('notifications-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Use a valid dummy VAPID public key (65 bytes when decoded)
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BOr7QwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('urlBase64ToUint8Array', () => {
    it('should convert base64 string to Uint8Array', () => {
      const base64String = 'dGVzdA=='; // 'test' in base64
      const result = urlBase64ToUint8Array(base64String);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([116, 101, 115, 116])); // 'test' in ASCII
    });

    it('should handle base64 strings with padding', () => {
      const base64String = 'dGVzdA=='; // Already has padding
      const result = urlBase64ToUint8Array(base64String);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4);
    });

    it('should handle base64 strings without padding', () => {
      const base64String = 'dGVzdA'; // Missing padding
      const result = urlBase64ToUint8Array(base64String);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4); // 'dGVzdA' with padding becomes 'dGVzdA==' which is 4 bytes
    });

    it('should handle empty string', () => {
      const result = urlBase64ToUint8Array('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle base64 strings with URL-safe characters', () => {
      const base64String = 'dGVzdC1kYXRh'; // 'test-data' in base64
      const result = urlBase64ToUint8Array(base64String);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(9);
    });
  });

  describe('isNotificationSupported', () => {
    let originalWindow: any;
    let originalNavigator: any;

    beforeEach(() => {
      originalWindow = globalThis.window;
      originalNavigator = globalThis.navigator;
      (globalThis as any).window = {};
      (globalThis as any).navigator = {};
    });

    afterEach(() => {
      (globalThis as any).window = originalWindow;
      (globalThis as any).navigator = originalNavigator;
    });

    it('should return true when all APIs are supported', () => {
      (globalThis.window as any).Notification = {};
      (globalThis.window as any).PushManager = {};
      (globalThis.navigator as any).serviceWorker = {};
      expect(isNotificationSupported()).toBe(true);
    });

    it('should return false when Notification is not supported', () => {
      delete (globalThis.window as any).Notification;
      (globalThis.window as any).PushManager = {};
      (globalThis.navigator as any).serviceWorker = {};
      expect(isNotificationSupported()).toBe(false);
    });

    it('should return false when serviceWorker is not supported', () => {
      (globalThis.window as any).Notification = {};
      (globalThis.window as any).PushManager = {};
      delete (globalThis.navigator as any).serviceWorker;
      expect(isNotificationSupported()).toBe(false);
    });

    it('should return false when PushManager is not supported', () => {
      (globalThis.window as any).Notification = {};
      delete (globalThis.window as any).PushManager;
      (globalThis.navigator as any).serviceWorker = {};
      expect(isNotificationSupported()).toBe(false);
    });

    it('should return false when no APIs are supported', () => {
      delete (globalThis.window as any).Notification;
      delete (globalThis.window as any).PushManager;
      delete (globalThis.navigator as any).serviceWorker;
      expect(isNotificationSupported()).toBe(false);
    });
  });

  // Suppress expected console errors for error cases
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.error as Mock).mockRestore();
  });

  describe('checkExistingSubscription', () => {
    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn()
      }
    };

    const mockServiceWorker = {
      ready: Promise.resolve(mockRegistration)
    };

    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: mockServiceWorker
        },
        writable: true
      });
    });

    it('should return true when subscription exists', async () => {
      const mockSubscription = { endpoint: 'test-endpoint' };
      mockRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);

      const result = await checkExistingSubscription();
      expect(result).toBe(true);
    });

    it('should return false when no subscription exists', async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(null);

      const result = await checkExistingSubscription();
      expect(result).toBe(false);
    });

    it('should return false when error occurs', async () => {
      mockRegistration.pushManager.getSubscription.mockRejectedValue(new Error('Service worker error'));

      const result = await checkExistingSubscription();
      expect(result).toBe(false);
    });
  });

  describe('subscribeToNotifications', () => {
    const mockRegistration = {
      pushManager: {
        subscribe: vi.fn()
      }
    };

    const mockServiceWorker = {
      ready: Promise.resolve(mockRegistration)
    };

    const mockNotification = {
      requestPermission: vi.fn()
    };

    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: mockServiceWorker
        },
        writable: true
      });

      Object.defineProperty(global, 'Notification', {
        value: mockNotification,
        writable: true
      });
    });

    it('should subscribe successfully when permission is granted', async () => {
      const mockSubscription = {
        endpoint: 'test-endpoint',
        toJSON: () => ({ endpoint: 'test-endpoint' })
      };

      mockNotification.requestPermission.mockResolvedValue('granted');
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);

      const mockSubscribeUser = vi.mocked(notificationActions.subscribeUser);
      mockSubscribeUser.mockResolvedValue({ success: true });

      await subscribeToNotifications();

      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array)
      });
      expect(mockSubscribeUser).toHaveBeenCalled();
    });

    it('should not subscribe when permission is denied', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');

      const mockSubscribeUser = vi.mocked(notificationActions.subscribeUser);

      await subscribeToNotifications();

      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(mockRegistration.pushManager.subscribe).not.toHaveBeenCalled();
      expect(mockSubscribeUser).not.toHaveBeenCalled();
    });

    it('should not subscribe when permission is default', async () => {
      mockNotification.requestPermission.mockResolvedValue('default');

      const mockSubscribeUser = vi.mocked(notificationActions.subscribeUser);

      await subscribeToNotifications();

      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(mockRegistration.pushManager.subscribe).not.toHaveBeenCalled();
      expect(mockSubscribeUser).not.toHaveBeenCalled();
    });

    it('should throw error when subscription endpoint is null', async () => {
      const mockSubscription = {
        endpoint: null,
        toJSON: () => ({ endpoint: null })
      };

      mockNotification.requestPermission.mockResolvedValue('granted');
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);

      await expect(subscribeToNotifications()).rejects.toThrow('Subscription endpoint is null');
    });

    it('should handle subscription errors', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      mockRegistration.pushManager.subscribe.mockRejectedValue(new Error('Subscription failed'));

      await expect(subscribeToNotifications()).rejects.toThrow('Subscription failed');
    });
  });

  describe('unsubscribeFromNotifications', () => {
    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn()
      }
    };

    const mockServiceWorker = {
      ready: Promise.resolve(mockRegistration)
    };

    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: mockServiceWorker
        },
        writable: true
      });
    });

    it('should unsubscribe successfully when subscription exists', async () => {
      const mockSubscription = {
        endpoint: 'test-endpoint',
        unsubscribe: vi.fn().mockResolvedValue(true),
        toJSON: () => ({ endpoint: 'test-endpoint' })
      };

      mockRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);

      const mockUnsubscribeUser = vi.mocked(notificationActions.unsubscribeUser);
      mockUnsubscribeUser.mockResolvedValue({ success: true });

      await unsubscribeFromNotifications();

      expect(mockRegistration.pushManager.getSubscription).toHaveBeenCalled();
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(mockUnsubscribeUser).toHaveBeenCalled();
    });

    it('should handle case when no subscription exists', async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(null);

      const mockUnsubscribeUser = vi.mocked(notificationActions.unsubscribeUser);
      mockUnsubscribeUser.mockResolvedValue({ success: true });

      await unsubscribeFromNotifications();

      expect(mockRegistration.pushManager.getSubscription).toHaveBeenCalled();
      expect(mockUnsubscribeUser).toHaveBeenCalled();
    });
  });
}); 