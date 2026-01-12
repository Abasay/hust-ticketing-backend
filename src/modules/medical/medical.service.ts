import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repositories } from 'src/shared/enums/db.enum';
import { BaseRepository } from '../repository/base.repository';
import { UpdateWalletDto } from './dtos/update-wallet.dto';
import { CreateStudentDto } from './dtos/create-student.dto';
import { UpdateStudentDto } from './dtos/update-student.dto';
import { CreateMedicalRecordDto } from './dtos/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dtos/update-medical-record.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';
import { Student } from './schemas/student.schema';
import { MedicalWallet } from './schemas/medical-wallet.schema';
import { MedicalRecord } from './schemas/medical-record.schema';
import { MedicalWalletHistory } from './schemas/wallet-history.schema';

@Injectable()
export class MedicalService {
  constructor(
    @Inject(Repositories.StudentRepository) private readonly studentRepo: BaseRepository<Student>,
    @Inject(Repositories.MedicalWalletRepository) private readonly medicalWalletRepo: BaseRepository<MedicalWallet>,
    @Inject(Repositories.MedicalRecordRepository) private readonly medicalRecordRepo: BaseRepository<MedicalRecord>,
    @Inject(Repositories.MedicalWalletHistoryRepository) private readonly medicalWalletHistoryRepo: BaseRepository<MedicalWalletHistory>,
    @InjectModel(DatabaseModelNames.MEDICAL_WALLET) private readonly medicalWalletModel: Model<MedicalWallet>,
    @InjectModel(DatabaseModelNames.MEDICAL_RECORD) private readonly medicalRecordModel: Model<MedicalRecord>,
    @InjectModel(DatabaseModelNames.MEDICAL_WALLET_HISTORY) private readonly medicalWalletHistoryModel: Model<MedicalWalletHistory>,
  ) {}

  async createStudent(payload: CreateStudentDto) {
    if (!payload.matricNo && !payload.temporaryMatricNo) {
      throw new BadRequestException('Either matricNo or temporaryMatricNo is required');
    }

    const existing = await this.studentRepo.findOne({
      $or: [{ matricNo: payload.matricNo }, { temporaryMatricNo: payload.temporaryMatricNo }],
    });
    if (existing) throw new BadRequestException('Student already exists');

    // create student

    const student = await this.studentRepo.create(payload as any);
    // create wallet
    await this.medicalWalletRepo.create({ studentId: student._id as any, balance: 0, lastUpdated: new Date() });
    return student;
  }

  async updateStudent(studentId: string, payload: UpdateStudentDto) {
    const existing = await this.studentRepo.findById(studentId);
    if (!existing) throw new NotFoundException('Student not found');
    return this.studentRepo.findOneAndUpdate({ _id: new Types.ObjectId(studentId) }, { $set: payload }, { new: true });
  }

  async getStudents(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ firstName: regex }, { lastName: regex }, { matricNo: regex }, { email: regex }];
    }
    if (query.faculty) filter.faculty = query.faculty;
    if (query.department) filter.department = query.department;
    if (query.sex) filter.sex = query.sex;

    const students = await this.studentRepo.findAll(filter, skip, limit);
    const total = await this.studentRepo.count(filter);
    return {
      students,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async getStudentById(id: string) {
    const student = await this.studentRepo.findById(id);
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async getStudentMedicalData(id: string, query: any) {
    const student = await this.getStudentById(id);
    const wallet = await this.medicalWalletRepo.findOne({ studentId: new Types.ObjectId(id) });
    let filter: any = {};

    console.log(query);
    if (query.session) filter.session = query.session;
    const records = await this.medicalRecordRepo.findAll({ studentId: new Types.ObjectId(id), ...filter }, 0, 0, { dateTime: -1 });
    return { ...student.toObject(), wallet, medicalRecords: records };
  }

  getFaculties() {
    return ['Faculty of Engineering', 'Faculty of Medicine', 'Faculty of Social Sciences', 'Faculty of Law'];
  }

  getDepartments(faculty?: string) {
    // Simple mapping; could be extended
    const mapping = {
      'Faculty of Engineering': ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
      'Faculty of Medicine': ['Clinical Medicine', 'Nursing'],
      'Faculty of Social Sciences': ['Economics', 'Sociology'],
      'Faculty of Law': ['Law'],
    };
    if (faculty) return mapping[faculty] ?? [];
    return Object.values(mapping).flat();
  }

  async getWalletByStudentId(studentId: string) {
    const wallet = await this.medicalWalletRepo.findOne({ studentId: new Types.ObjectId(studentId) });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  private getAcademicSession(date: Date, override?: string) {
    if (override) return override;
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    // Academic session starting from August to July next year
    if (month >= 8) {
      return `${year}/${year + 1}`;
    }
    return `${year - 1}/${year}`;
  }

  async updateWalletBalance(studentId: string, dto: UpdateWalletDto, user?: any) {
    const studentObjId = new Types.ObjectId(studentId);
    let wallet = await this.medicalWalletModel.findOne({ studentId: studentObjId });
    if (!wallet) {
      wallet = await this.medicalWalletModel.create({ studentId: studentObjId, balance: 0, lastUpdated: new Date() });
    }

    const amount = Number(dto.amount) || 0;
    const before = wallet.balance || 0;
    const after = dto.transactionType === 'credit' ? before + amount : before - amount;
    await this.medicalWalletModel.updateOne({ _id: wallet._id }, { $set: { balance: after, lastUpdated: new Date() } });

    const sessionStr = this.getAcademicSession(new Date(), dto['session']);

    // create wallet history
    await this.medicalWalletHistoryModel.create({
      studentId: studentObjId,
      amount: amount,
      balanceBefore: before,
      balanceAfter: after,
      transactionType: dto.transactionType,
      reason: dto.reason,
      notes: dto['notes'],
      createdBy: user?._id ? new Types.ObjectId(user._id) : undefined,
      session: sessionStr,
    });

    const updated = await this.medicalWalletModel.findOne({ studentId: studentObjId });
    return updated;
  }

  async getMedicalRecords(studentId: string, query: any) {
    console.log(query);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'dateTime';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    const filter: any = { studentId: new Types.ObjectId(studentId) };
    if (query.session) filter.session = query.session;
    const records = await this.medicalRecordRepo.findAll(filter, skip, limit, sort);
    const total = await this.medicalRecordRepo.count(filter);
    return { records, total, totalPages: Math.ceil(total / limit), currentPage: page };
  }

  async getAllMedicalRecords(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'dateTime';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    const filter: any = {};
    if (query.session) filter.session = query.session;
    if (query.studentId) filter.studentId = new Types.ObjectId(query.studentId);
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ illnessOrReason: regex }, { notes: regex }];
    }

    const records = await this.medicalRecordRepo.findAllAndPopulate(
      filter,
      { path: 'studentId', select: 'firstName lastName matricNo faculty department email phoneNumber' },
      sort,
      skip,
      limit,
    );
    const total = await this.medicalRecordRepo.count(filter);
    return { records, total, totalPages: Math.ceil(total / limit), currentPage: page };
  }

  async getMedicalRecordById(recordId: string) {
    const rec = await this.medicalRecordRepo.findById(recordId);
    if (!rec) throw new NotFoundException('Record not found');
    return rec;
  }

  async getWalletHistory(studentId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const filter: any = { studentId: new Types.ObjectId(studentId) };
    if (query.session) filter.session = query.session;

    const histories = await this.medicalWalletHistoryRepo.findAll(filter, skip, limit, sort);
    const total = await this.medicalWalletHistoryRepo.count(filter);
    return { histories, total, totalPages: Math.ceil(total / limit), currentPage: page };
  }

  async addMedicalRecord(payload: CreateMedicalRecordDto, user?: any) {
    const studentObjId = new Types.ObjectId(payload.studentId);
    let wallet = await this.medicalWalletModel.findOne({ studentId: studentObjId });
    if (!wallet) {
      wallet = await this.medicalWalletModel.create({ studentId: studentObjId, balance: 0, lastUpdated: new Date() });
    }

    const walletBalance = wallet.balance || 0;
    const amount = Number(payload.amount) || 0;
    const paymentStatus = walletBalance >= amount ? 'paid' : 'unpaid';
    const newBalance = walletBalance - amount;

    await this.medicalWalletModel.updateOne({ _id: wallet._id }, { $set: { balance: newBalance, lastUpdated: new Date() } });

    const recordSession = payload.session ?? this.getAcademicSession(new Date(payload.dateTime ? new Date(payload.dateTime) : new Date()));

    // create wallet history entry
    await this.medicalWalletHistoryModel.create({
      studentId: studentObjId,
      amount: amount,
      balanceBefore: walletBalance,
      balanceAfter: newBalance,
      transactionType: 'medical',
      reason: 'medical record payment',
      notes: payload.notes,
      createdBy: user?._id ? new Types.ObjectId(user._id) : undefined,
      session: recordSession,
    });

    const created = await this.medicalRecordModel.create({
      ...payload,
      studentId: studentObjId,
      walletBalanceAfter: newBalance,
      paymentStatus,
      dateTime: new Date(payload.dateTime),
      session: recordSession,
    });

    return created;
  }

  async updateMedicalRecord(recordId: string, payload: UpdateMedicalRecordDto) {
    const existing = await this.medicalRecordRepo.findById(recordId);
    if (!existing) throw new NotFoundException('Record not found');

    if (payload.amount && payload.amount !== existing.amount) {
      const diff = Number(payload.amount) - Number(existing.amount);
      // if amount increased, deduct diff; if decreased, credit back diff

      let wallet = await this.medicalWalletModel.findOne({ studentId: existing.studentId });
      if (!wallet) {
        wallet = await this.medicalWalletModel.create({ studentId: existing.studentId, balance: 0, lastUpdated: new Date() });
      }
      const current = wallet.balance ?? 0;
      const newBalance = current - diff;
      await this.medicalWalletModel.updateOne({ _id: wallet._id }, { $set: { balance: newBalance, lastUpdated: new Date() } });

      const transType = diff > 0 ? 'debit' : 'credit';
      const amountToRecord = Math.abs(diff);

      const recordSession = payload.session ?? existing.session ?? this.getAcademicSession(new Date(existing.dateTime));

      await this.medicalWalletHistoryModel.create({
        studentId: existing.studentId,
        amount: amountToRecord,
        balanceBefore: current,
        balanceAfter: newBalance,
        transactionType: transType,
        reason: 'medical record update',
        notes: payload['notes'],
        session: recordSession,
      });

      payload['walletBalanceAfter'] = newBalance;
      payload['paymentStatus'] = newBalance >= 0 ? 'paid' : 'unpaid';
      // propagate session to the record if provided
      if (payload.session) payload['session'] = payload.session;
    }

    return this.medicalRecordRepo.findOneAndUpdate({ _id: recordId }, { $set: payload }, { new: true });
  }

  async deleteMedicalRecord(recordId: string, overrideSession?: string) {
    const existing = await this.medicalRecordRepo.findById(recordId);
    if (!existing) throw new NotFoundException('Record not found');
    // reverse wallet by returning the amount

    let wallet = await this.medicalWalletModel.findOne({ studentId: existing.studentId });
    if (!wallet) {
      wallet = await this.medicalWalletModel.create({ studentId: existing.studentId, balance: 0, lastUpdated: new Date() });
    }
    const current = wallet.balance ?? 0;
    const newBalance = current + Number(existing.amount);
    await this.medicalWalletModel.updateOne({ _id: wallet._id }, { $set: { balance: newBalance, lastUpdated: new Date() } });

    const recordSession = overrideSession ?? existing.session ?? this.getAcademicSession(new Date(existing.dateTime));

    await this.medicalWalletHistoryModel.create({
      studentId: existing.studentId,
      amount: Number(existing.amount),
      balanceBefore: current,
      balanceAfter: newBalance,
      transactionType: 'credit',
      reason: 'medical record deletion reversal',
      notes: existing.notes,
      session: recordSession,
    });

    await this.medicalRecordRepo.findByIdAndDelete(recordId);

    return { success: true, message: 'Medical record deleted successfully' };
  }

  async getMedicalStatistics(studentId: string, query?: any) {
    const filter: any = { studentId: new Types.ObjectId(studentId) };
    if (query?.session) filter.session = query.session;

    const totalRecords = await this.medicalRecordRepo.count(filter);
    const records = await this.medicalRecordRepo.findAll(filter, 0, 0, { dateTime: -1 });
    const totalAmountSpent = records.reduce((s, r) => s + (r.amount || 0), 0);
    const paidRecords = records.filter((r) => r.paymentStatus === 'paid').length;
    const unpaidRecords = records.filter((r) => r.paymentStatus === 'unpaid').length;
    const commonIllnesses = Object.entries(
      records.reduce((acc, r) => {
        acc[r.illnessOrReason] = (acc[r.illnessOrReason] || 0) + 1;
        return acc;
      }, {} as any),
    ).map(([illness, count]) => ({ illness, count }));
    const lastVisit = records[0]?.dateTime ?? null;
    return { totalRecords, totalAmountSpent, paidRecords, unpaidRecords, commonIllnesses, lastVisit };
  }
}
