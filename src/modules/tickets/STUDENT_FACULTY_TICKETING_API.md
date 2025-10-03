# Student & Faculty Ticketing API Endpoints

This document provides a comprehensive overview of the student and faculty ticketing system endpoints, including their payloads and response formats.

## Authentication

All endpoints require authentication with appropriate roles.

**Authentication**: Bearer Token Required  
**Roles**: CASHIER, ADMIN (unless otherwise specified)

---

# STUDENT TICKETING ENDPOINTS

## Base URL: `/tickets/student`

### 1. Generate Student Ticket (Single Purchase)

**Endpoint**: `POST /tickets/student/generate`

**Description**: Generate a single ticket for a student. Creates student account if not exists.

**Request Payload**:

```json
{
  "matricNumber": "CSC/2020/001",
  "ticketType": "BREAKFAST",
  "amount": 500,
  "paymentType": "CASH",
  "expiryDate": "2024-12-31T23:59:59.000Z"
}
```

**Response**:

```json
{
  "message": "Student ticket generated successfully",
  "ticket": {
    "ticketNo": "TKT-2024-0001",
    "ticketType": "BREAKFAST",
    "amount": 500,
    "status": "ACTIVE",
    "expiryDate": "2024-12-31T23:59:59.000Z",
    "student": {
      "_id": "507f1f77bcf86cd799439020",
      "matricNumber": "CSC/2020/001",
      "firstName": "Student",
      "lastName": "CSC/2020/001",
      "email": "CSC/2020/001@temp.edu"
    },
    "createdAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 2. Fund Student Wallet (Bulk Purchase)

**Endpoint**: `POST /tickets/student/fund-wallet`

**Description**: Add funds to student's wallet for future ticket purchases. Creates student account if not exists.

**Request Payload**:

```json
{
  "matricNumber": "CSC/2020/001",
  "amount": 5000
}
```

**Response**:

```json
{
  "message": "Wallet topped up successfully",
  "wallet": {
    "matricNumber": "CSC/2020/001",
    "walletBalance": 5000,
    "walletUsed": 0,
    "availableBalance": 5000
  }
}
```

---

### 3. Purchase Ticket Using Wallet

**Endpoint**: `POST /tickets/student/wallet-purchase`

**Description**: Purchase a ticket using funds from student's wallet.

**Request Payload**:

```json
{
  "matricNumber": "CSC/2020/001",
  "ticketType": "LUNCH",
  "amount": 800,
  "expiryDate": "2024-12-31T23:59:59.000Z"
}
```

**Response**:

```json
{
  "message": "Ticket purchased from wallet successfully",
  "data": {
    "ticket": {
      "ticketNo": "TKT-2024-0002",
      "ticketType": "LUNCH",
      "amount": 800,
      "status": "ACTIVE",
      "expiryDate": "2024-12-31T23:59:59.000Z"
    },
    "wallet": {
      "walletBalance": 5000,
      "walletUsed": 800,
      "availableBalance": 4200
    }
  }
}
```

---

# FACULTY TICKETING ENDPOINTS

## Base URL: `/tickets/faculty`

### 1. Generate Faculty Tickets

**Endpoint**: `POST /tickets/faculty/generate`

**Description**: Generate tickets for multiple staff members with equal amount distribution. Creates staff accounts if they don't exist.

**Request Payload**:

```json
{
  "staffIds": ["STAFF001", "STAFF002", "STAFF003"],
  "ticketType": "LUNCH",
  "totalAmount": 3000,
  "paymentType": "CASH",
  "expiryDate": "2024-12-31T23:59:59.000Z"
}
```

**Response**:

```json
{
  "message": "Faculty tickets generated successfully",
  "data": {
    "totalTickets": 3,
    "amountPerTicket": 1000,
    "tickets": [
      {
        "ticketNo": "TKT-2024-0003",
        "ticketType": "LUNCH",
        "amount": 1000,
        "status": "ACTIVE",
        "expiryDate": "2024-12-31T23:59:59.000Z",
        "staff": {
          "_id": "507f1f77bcf86cd799439021",
          "staffId": "STAFF001",
          "firstName": "Staff",
          "lastName": "STAFF001",
          "email": "STAFF001@temp.edu"
        },
        "createdAt": "2024-01-15T08:00:00.000Z"
      },
      {
        "ticketNo": "TKT-2024-0004",
        "ticketType": "LUNCH",
        "amount": 1000,
        "status": "ACTIVE",
        "expiryDate": "2024-12-31T23:59:59.000Z",
        "staff": {
          "_id": "507f1f77bcf86cd799439022",
          "staffId": "STAFF002",
          "firstName": "Staff",
          "lastName": "STAFF002",
          "email": "STAFF002@temp.edu"
        },
        "createdAt": "2024-01-15T08:00:00.000Z"
      },
      {
        "ticketNo": "TKT-2024-0005",
        "ticketType": "LUNCH",
        "amount": 1000,
        "status": "ACTIVE",
        "expiryDate": "2024-12-31T23:59:59.000Z",
        "staff": {
          "_id": "507f1f77bcf86cd799439023",
          "staffId": "STAFF003",
          "firstName": "Staff",
          "lastName": "STAFF003",
          "email": "STAFF003@temp.edu"
        },
        "createdAt": "2024-01-15T08:00:00.000Z"
      }
    ]
  }
}
```

---

### 2. Get Staff Tickets for Printing

**Endpoint**: `GET /tickets/staff/:staffId`

**Description**: Retrieve all tickets for a specific staff member for printing purposes.

**Roles**: CASHIER, ADMIN, VENDOR

**Path Parameters**:
- `staffId`: Staff identifier

**Response**:

```json
{
  "message": "Staff tickets retrieved successfully",
  "tickets": [
    {
      "ticketNo": "TKT-2024-0003",
      "ticketType": "LUNCH",
      "amount": 1000,
      "status": "ACTIVE",
      "expiryDate": "2024-12-31T23:59:59.000Z",
      "createdAt": "2024-01-15T08:00:00.000Z"
    },
    {
      "ticketNo": "TKT-2024-0010",
      "ticketType": "BREAKFAST",
      "amount": 500,
      "status": "REDEEMED",
      "expiryDate": "2024-12-31T23:59:59.000Z",
      "createdAt": "2024-01-16T08:00:00.000Z"
    }
  ]
}
```

---

# DATA TYPES & ENUMS

## Ticket Types
- `BREAKFAST`
- `LUNCH`
- `DINNER`
- `SNACK`

## Payment Types
- `CASH`
- `TRANSFER`
- `POS`
- `WALLET` (automatically set for wallet purchases)

## Ticket Status
- `ACTIVE`
- `REDEEMED`
- `EXPIRED`
- `CANCELLED`

## User Roles
- `STUDENT`
- `STAFF`
- `CASHIER`
- `ADMIN`
- `VENDOR`

---

# BUSINESS RULES

## Student Flow Rules

1. **Auto User Creation**: If student with matricNumber doesn't exist, system creates:
   - `password = null`
   - `isAccountLocked = true`
   - `role = STUDENT`
   - `email = {matricNumber}@temp.edu`

2. **Wallet System**:
   - `walletBalance` = total funds added to wallet
   - `walletUsed` = total funds consumed
   - `availableBalance` = walletBalance - walletUsed

3. **Wallet Purchase Validation**:
   - Must have sufficient available balance
   - Payment type automatically set to `WALLET`

## Faculty Flow Rules

1. **Auto User Creation**: If staff with staffId doesn't exist, system creates:
   - `password = null`
   - `isAccountLocked = true`
   - `role = STAFF`
   - `email = {staffId}@temp.edu`

2. **Amount Distribution**:
   - Total amount must be divisible equally among all selected staff
   - Each staff gets `totalAmount / numberOfStaff`
   - If not divisible, request is rejected

3. **Bulk Generation**:
   - All tickets generated with same type and expiry date
   - Each ticket linked to respective staff member

---

# ERROR RESPONSES

**400 Bad Request** (Insufficient Wallet Balance):
```json
{
  "statusCode": 400,
  "message": "Insufficient wallet balance",
  "error": "Bad Request"
}
```

**400 Bad Request** (Amount Not Divisible):
```json
{
  "statusCode": 400,
  "message": "Total amount must be divisible equally among selected staff",
  "error": "Bad Request"
}
```

**404 Not Found** (Student/Staff Not Found):
```json
{
  "statusCode": 404,
  "message": "Student not found",
  "error": "Not Found"
}
```

**404 Not Found** (Wallet Not Found):
```json
{
  "statusCode": 404,
  "message": "Student wallet not found",
  "error": "Not Found"
}
```

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

# WORKFLOW EXAMPLES

## Complete Student Workflow

### 1. Fund Student Wallet
```
POST /tickets/student/fund-wallet
{
  "matricNumber": "CSC/2020/001",
  "amount": 10000
}
```

### 2. Purchase Multiple Tickets from Wallet
```
POST /tickets/student/wallet-purchase
{
  "matricNumber": "CSC/2020/001",
  "ticketType": "BREAKFAST",
  "amount": 500,
  "expiryDate": "2024-12-31T23:59:59.000Z"
}
```

## Complete Faculty Workflow

### 1. Generate Faculty Tickets
```
POST /tickets/faculty/generate
{
  "staffIds": ["STAFF001", "STAFF002"],
  "ticketType": "LUNCH",
  "totalAmount": 2000,
  "paymentType": "CASH",
  "expiryDate": "2024-12-31T23:59:59.000Z"
}
```

### 2. Print Staff Tickets
```
GET /tickets/staff/STAFF001
```
```

This documentation covers all the new student and faculty ticketing endpoints with their complete request/response formats, business rules, and workflow examples.
</augment_code_snippet>