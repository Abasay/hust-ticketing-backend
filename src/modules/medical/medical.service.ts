import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repositories } from 'src/shared/enums/db.enum';
import { BaseRepository } from '../repository/base.repository';
import { UpdateWalletDto } from './dtos/update-wallet.dto';
import { CreateStudentDto } from './dtos/create-student.dto';
import { UpdateStudentDto } from './dtos/update-student.dto';
import { CreateMedicalRecordDto } from './dtos/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dtos/update-medical-record.dto';
import { Student } from './schemas/student.schema';
import { MedicalWallet } from './schemas/medical-wallet.schema';
import { MedicalRecord } from './schemas/medical-record.schema';
import { Types } from 'mongoose';

@Injectable()
export class MedicalService {
  constructor(
    @Inject(Repositories.StudentRepository) private readonly studentRepo: BaseRepository<Student>,
    @Inject(Repositories.MedicalWalletRepository) private readonly medicalWalletRepo: BaseRepository<MedicalWallet>,
    @Inject(Repositories.MedicalRecordRepository) private readonly medicalRecordRepo: BaseRepository<MedicalRecord>,
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
    return this.studentRepo.findOneAndUpdate({ _id: studentId }, { $set: payload }, { new: true });
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

  async getStudentMedicalData(id: string) {
    const student = await this.getStudentById(id);
    const wallet = await this.medicalWalletRepo.findOne({ studentId: new Types.ObjectId(id) });
    const records = await this.medicalRecordRepo.findAll({ studentId: new Types.ObjectId(id) }, 0, 0, { dateTime: -1 });
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

  async updateWalletBalance(studentId: string, dto: UpdateWalletDto) {
    const wallet =
      (await this.medicalWalletRepo.findOne({ studentId: new Types.ObjectId(studentId) })) ||
      (await this.medicalWalletRepo.create({ studentId: new Types.ObjectId(studentId), balance: 0, lastUpdated: new Date() }));
    const amount = Number(dto.amount) || 0;
    let newBalance = wallet.balance || 0;
    if (dto.transactionType === 'credit') {
      newBalance = newBalance + amount;
    } else {
      newBalance = newBalance - amount;
    }
    const updated = await this.medicalWalletRepo.findOneAndUpdate(
      { studentId: new Types.ObjectId(studentId) },
      { $set: { balance: newBalance, lastUpdated: new Date() } },
    );
    return updated;
  }

  async getMedicalRecords(studentId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'dateTime';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    const filter: any = { studentId };
    const records = await this.medicalRecordRepo.findAll(filter, skip, limit, sort);
    const total = await this.medicalRecordRepo.count(filter);
    return { records, total, totalPages: Math.ceil(total / limit), currentPage: page };
  }

  async getMedicalRecordById(recordId: string) {
    const rec = await this.medicalRecordRepo.findById(recordId);
    if (!rec) throw new NotFoundException('Record not found');
    return rec;
  }

  async addMedicalRecord(payload: CreateMedicalRecordDto) {
    console.log('Reached here 1');
    const wallet =
      (await this.medicalWalletRepo.findOne({ studentId: new Types.ObjectId(payload.studentId) })) ||
      (await this.medicalWalletRepo.create({ studentId: new Types.ObjectId(payload.studentId), balance: 0, lastUpdated: new Date() }));
    console.log('Reached Here');
    const walletBalance = wallet.balance || 0;
    const amount = Number(payload.amount) || 0;
    const paymentStatus = walletBalance >= amount ? 'paid' : 'unpaid';
    const newBalance = walletBalance - amount;
    await this.medicalWalletRepo.findOneAndUpdate(
      { studentId: new Types.ObjectId(payload.studentId) },
      { $set: { balance: newBalance, lastUpdated: new Date() } },
    );

    const record = await this.medicalRecordRepo.create({
      ...payload,
      studentId: new Types.ObjectId(payload.studentId),
      walletBalanceAfter: newBalance,
      paymentStatus,
      dateTime: new Date(payload.dateTime),
    });
    return record;
  }

  async updateMedicalRecord(recordId: string, payload: UpdateMedicalRecordDto) {
    const existing = await this.medicalRecordRepo.findById(recordId);
    if (!existing) throw new NotFoundException('Record not found');

    if (payload.amount && payload.amount !== existing.amount) {
      const diff = Number(payload.amount) - Number(existing.amount);
      // if amount increased, deduct diff; if decreased, credit back diff
      const wallet = await this.medicalWalletRepo.findOne({ studentId: existing.studentId });
      const current = wallet?.balance ?? 0;
      const newBalance = current - diff;
      await this.medicalWalletRepo.findOneAndUpdate(
        { studentId: existing.studentId },
        { $set: { balance: newBalance, lastUpdated: new Date() } },
      );
      payload['walletBalanceAfter'] = newBalance;
      payload['paymentStatus'] = newBalance >= 0 ? 'paid' : 'unpaid';
    }

    return this.medicalRecordRepo.findOneAndUpdate({ _id: recordId }, { $set: payload }, { new: true });
  }

  async deleteMedicalRecord(recordId: string) {
    const existing = await this.medicalRecordRepo.findById(recordId);
    if (!existing) throw new NotFoundException('Record not found');
    // reverse wallet by returning the amount
    const wallet = await this.medicalWalletRepo.findOne({ studentId: existing.studentId });
    const current = wallet?.balance ?? 0;
    const newBalance = current + Number(existing.amount);
    await this.medicalWalletRepo.findOneAndUpdate(
      { studentId: existing.studentId },
      { $set: { balance: newBalance, lastUpdated: new Date() } },
    );
    await this.medicalRecordRepo.findByIdAndDelete(recordId);
    return { success: true, message: 'Medical record deleted successfully' };
  }

  async getMedicalStatistics(studentId: string) {
    const totalRecords = await this.medicalRecordRepo.count({ studentId });
    const records = await this.medicalRecordRepo.findAll({ studentId }, 0, 0, { dateTime: -1 });
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
