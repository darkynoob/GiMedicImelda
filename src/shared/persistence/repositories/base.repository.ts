export interface IBaseRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TFindManyArgs,
  TCountArgs,
  TUpsertArgs,
> {
  findById(id: string): Promise<TModel | null>;
  findMany(args?: TFindManyArgs): Promise<TModel[]>;
  count(args?: TCountArgs): Promise<number>;
  create(data: TCreateInput): Promise<TModel>;
  update(id: string, data: TUpdateInput): Promise<TModel>;
  delete(id: string): Promise<TModel>;
  upsert(args: TUpsertArgs): Promise<TModel>;
}
