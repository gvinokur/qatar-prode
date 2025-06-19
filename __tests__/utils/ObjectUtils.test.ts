import { toMap, customToMap } from '../../app/utils/ObjectUtils';

describe('ObjectUtils', () => {
  describe('toMap', () => {
    it('should convert array of objects with id to map', () => {
      const objects = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' }
      ];
      
      const result = toMap(objects);
      
      expect(result).toEqual({
        '1': { id: '1', name: 'Alice' },
        '2': { id: '2', name: 'Bob' },
        '3': { id: '3', name: 'Charlie' }
      });
    });

    it('should handle empty array', () => {
      const result = toMap([]);
      expect(result).toEqual({});
    });

    it('should handle array with single object', () => {
      const objects = [{ id: '1', name: 'Alice' }];
      const result = toMap(objects);
      expect(result).toEqual({
        '1': { id: '1', name: 'Alice' }
      });
    });

    it('should handle objects with different properties', () => {
      const objects = [
        { id: '1', name: 'Alice', age: 25 },
        { id: '2', name: 'Bob', city: 'NYC' }
      ];
      
      const result = toMap(objects);
      
      expect(result).toEqual({
        '1': { id: '1', name: 'Alice', age: 25 },
        '2': { id: '2', name: 'Bob', city: 'NYC' }
      });
    });
  });

  describe('customToMap', () => {
    it('should convert array using custom key extractor', () => {
      const objects = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' }
      ];
      
      const result = customToMap(objects, obj => obj.name);
      
      expect(result).toEqual({
        'Alice': { id: '1', name: 'Alice' },
        'Bob': { id: '2', name: 'Bob' },
        'Charlie': { id: '3', name: 'Charlie' }
      });
    });

    it('should handle empty array', () => {
      const result = customToMap([], (obj: any) => obj.id);
      expect(result).toEqual({});
    });

    it('should handle array with single object', () => {
      const objects = [{ id: '1', name: 'Alice' }];
      const result = customToMap(objects, obj => obj.name);
      expect(result).toEqual({
        'Alice': { id: '1', name: 'Alice' }
      });
    });

    it('should handle numeric keys', () => {
      const objects = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      
      const result = customToMap(objects, obj => obj.id);
      
      expect(result).toEqual({
        1: { id: 1, name: 'Alice' },
        2: { id: 2, name: 'Bob' }
      });
    });

    it('should handle complex key extraction', () => {
      const objects = [
        { id: '1', name: 'Alice', age: 25 },
        { id: '2', name: 'Bob', age: 30 }
      ];
      
      const result = customToMap(objects, obj => `${obj.name}-${obj.age}`);
      
      expect(result).toEqual({
        'Alice-25': { id: '1', name: 'Alice', age: 25 },
        'Bob-30': { id: '2', name: 'Bob', age: 30 }
      });
    });
  });
}); 