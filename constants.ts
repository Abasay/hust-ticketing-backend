export enum DatabaseModelNames {
  USER = 'User',
  AUTHORIZED_USER = 'AuthorizedUser',
  TICKET = 'Ticket',
  TRANSACTION = 'Transaction',
  REDEMPTION = 'Redemption',
  REPORT = 'Report',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  VENDOR = 'VENDOR',
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum TicketType {
  MEAL = 'MEAL',
  WATER = 'WATER',
  SNACK = 'SNACK',
  OTHER = 'OTHER',
}

export enum PaymentType {
  CASH = 'CASH',
  POS = 'POS',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

export enum TicketStatus {
  ISSUED = 'ISSUED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum RedemptionStatus {
  REDEEMED = 'REDEEMED',
  FAILED = 'FAILED',
}
