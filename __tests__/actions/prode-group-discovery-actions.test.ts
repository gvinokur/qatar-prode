import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getPublicGroupsAction } from '@/app/actions/prode-group-discovery-actions';

// Mock the repository
vi.mock('@/app/db/prode-group-repository', () => ({
  findPublicGroups: vi.fn(),
  countPublicGroups: vi.fn(),
}));

import * as groupRepository from '@/app/db/prode-group-repository';

const mockFindPublicGroups = vi.mocked(groupRepository.findPublicGroups);
const mockCountPublicGroups = vi.mocked(groupRepository.countPublicGroups);

const mockPublicGroup = {
  id: 'group-1',
  name: 'Test Public Group',
  description: 'A test group',
  is_public: true,
  owner: { id: 'user-1', name: 'Test Owner' },
  memberCount: 5,
};

describe('getPublicGroupsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindPublicGroups.mockResolvedValue([mockPublicGroup]);
    mockCountPublicGroups.mockResolvedValue(5);
  });

  it('should return paginated public groups', async () => {
    const result = await getPublicGroupsAction();

    expect(result).toEqual({
      groups: [mockPublicGroup],
      totalCount: 5,
      currentPage: 1,
      totalPages: 1,
    });
    expect(mockFindPublicGroups).toHaveBeenCalledWith(undefined, 20, 0);
    expect(mockCountPublicGroups).toHaveBeenCalledWith(undefined);
  });

  it('should return error for page > 100 (DoS prevention)', async () => {
    const result = await getPublicGroupsAction(undefined, 101);

    expect(result).toEqual({ error: 'Page must be between 1 and 100' });
    expect(mockFindPublicGroups).not.toHaveBeenCalled();
    expect(mockCountPublicGroups).not.toHaveBeenCalled();
  });

  it('should return error for page < 1', async () => {
    const result = await getPublicGroupsAction(undefined, 0);

    expect(result).toEqual({ error: 'Page must be between 1 and 100' });
    expect(mockFindPublicGroups).not.toHaveBeenCalled();
  });

  it('should apply search term', async () => {
    await getPublicGroupsAction('soccer');

    expect(mockFindPublicGroups).toHaveBeenCalledWith('soccer', 20, 0);
    expect(mockCountPublicGroups).toHaveBeenCalledWith('soccer');
  });

  it('should trim whitespace from search term', async () => {
    await getPublicGroupsAction('  soccer  ');

    expect(mockFindPublicGroups).toHaveBeenCalledWith('soccer', 20, 0);
    expect(mockCountPublicGroups).toHaveBeenCalledWith('soccer');
  });

  it('should treat blank search term as no search term', async () => {
    await getPublicGroupsAction('   ');

    expect(mockFindPublicGroups).toHaveBeenCalledWith(undefined, 20, 0);
    expect(mockCountPublicGroups).toHaveBeenCalledWith(undefined);
  });

  it('should calculate totalPages correctly for multiple pages', async () => {
    mockCountPublicGroups.mockResolvedValue(45);

    const result = await getPublicGroupsAction(undefined, 1);

    expect(result).toMatchObject({ totalPages: 3, totalCount: 45 });
  });

  it('should return totalPages of at least 1 even when count is 0', async () => {
    mockFindPublicGroups.mockResolvedValue([]);
    mockCountPublicGroups.mockResolvedValue(0);

    const result = await getPublicGroupsAction();

    expect(result).toMatchObject({ totalPages: 1, totalCount: 0, groups: [] });
  });

  it('should calculate correct offset for page 2', async () => {
    await getPublicGroupsAction(undefined, 2);

    expect(mockFindPublicGroups).toHaveBeenCalledWith(undefined, 20, 20);
  });

  it('should calculate correct offset for page 3', async () => {
    await getPublicGroupsAction(undefined, 3);

    expect(mockFindPublicGroups).toHaveBeenCalledWith(undefined, 20, 40);
  });

  it('should return currentPage matching the requested page', async () => {
    const result = await getPublicGroupsAction(undefined, 2);

    expect(result).toMatchObject({ currentPage: 2 });
  });
});
