import { QueryOptions, UpdateWriteOpResult } from 'mongoose';
import { Model, FilterQuery, UpdateQuery } from 'mongoose';

export class BaseRepository<T> {
  constructor(private readonly model: Model<T>) {}

  async findAll(filter: FilterQuery<T> = {}, skip?: number, limit?: number, sort?: Record<string, 1 | -1> | any): Promise<T[]> {
    return this.model
      .find(filter)
      .skip(skip || 0)
      .limit(limit || 0)
      .sort(sort ?? { createdAt: -1 })
      .exec();
  }

  async findAllAndPopulate(
    filter: FilterQuery<T>,
    populateFields:
      | {
          path: string;
          select: string;
          populate?:
            | {
                path: string;
                select: string;
              }
            | {
                path: string;
                select: string;
                populate?: {
                  path: string;
                  select: string;
                };
              }[];
        }
      | {
          path: string;
          select: string;
          populate?: {
            path: string;
            select: string;
          };
        }[],
    sort?: Record<string, 1 | -1> | any,
    skip?: number,
    limit?: number,
  ): Promise<T[]> {
    return this.model
      .find(filter)
      .populate(populateFields)
      .sort(sort ?? { createdAt: -1 })
      .skip(skip || 0)
      .limit(limit || 0)
      .setOptions({ strictPopulate: false })
      .exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const documents = await this.model.insertMany(data);
    return documents.map((doc) => doc as T);
  }
  //added this new lines
  async update(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update);
  }

  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateWriteOpResult> {
    return await this.model.updateMany(filter, update);
  }

  async delete(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOneAndDelete(filter).exec();
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: { new?: boolean; upsert?: boolean } = { new: true },
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, update, options).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async findOneAndPopulate(
    filter: FilterQuery<T>,
    populateFields:
      | {
          path: string;
          select: string;
          populate?:
            | {
                path: string;
                select: string;
              }
            | {
                path: string;
                select: string;
                populate?: {
                  path: string;
                  select: string;
                };
              }[];
        }
      | {
          path: string;
          select: string;
          populate?:
            | {
                path: string;
                select: string;
              }
            | {
                path: string;
                select: string;
                populate?: {
                  path: string;
                  select: string;
                };
              }[];
        }[],
  ): Promise<T | null> {
    return this.model.findOne(filter).populate(populateFields).setOptions({ strictPopulate: false }).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }
}
