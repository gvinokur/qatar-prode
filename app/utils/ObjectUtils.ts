import {Identifiable} from "../db/tables-definition";
import {Selectable} from "kysely";

export function toMap<K extends Selectable<Identifiable>>(objectList: K[]): {[key:string]: K} {
  const map =  Object.fromEntries(objectList.map(obj => [obj.id, obj]))
  return map
}

export function customToMap<K, T>(objectList: K[], keyExtractor: (obj:K) => T) {
  const map = Object.fromEntries(objectList.map(obj => [keyExtractor(obj), obj]))
  return map
}
