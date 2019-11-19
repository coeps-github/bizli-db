import { Observable } from 'rxjs';

export interface IBizliDb {
  create:
    <TID, TObject extends TID, TResult extends TID>
    (object: TObject) => Observable<TResult>;
  read:
    <TID, TQuery, TResult extends TID>
    (query: TQuery) => Observable<TResult>;
  update:
    <TID, TObject extends TID, TResult extends TID>
    (object: TObject) => Observable<TResult>;
  delete:
    <TID, TResult extends TID>
    (id: TID) => Observable<TResult>;

  createAll:
    <TID, TObject extends TID, TResult extends TID>
    (objects: Observable<TObject>) => Observable<TResult>;
  readAll:
    <TID, TQuery, TResult extends TID>
    (queries: Observable<TQuery>) => Observable<TResult>;
  updateAll:
    <TID, TObject extends TID, TResult extends TID>
    (objects: Observable<TObject>) => Observable<TResult>;
  deleteAll:
    <TID, TResult extends TID>
    (ids: Observable<TID>) => Observable<TResult>;

  readWhenChanged:
    <TID, TQuery, TResult extends TID>
    (query: TQuery) => Observable<TResult>;
}
