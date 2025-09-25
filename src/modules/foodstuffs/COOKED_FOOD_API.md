# Foodstuffs & Cooked Food API Endpoints

This document provides a comprehensive overview of all foodstuffs (raw materials), cooked food, and requisition related endpoints, including their payloads and response formats.

## Authentication

All endpoints require Admin authentication unless otherwise specified.

**Authentication**: Bearer Token Required  
**Role**: Admin Only

---

# FOODSTUFFS (RAW MATERIALS) ENDPOINTS

## Base URL: `/foodstuffs`

### 1. Create Foodstuff

**Endpoint**: `POST /foodstuffs`

**Description**: Create a new foodstuff (raw material) record

**Request Payload**:

```json
{
  "name": "Rice",
  "unit": "kg"
}
```

**Response**:

```json
{
  "message": "Foodstuff created successfully",
  "foodstuff": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Rice",
    "unit": "kg",
    "currentQuantity": 0,
    "averageCostPrice": 0,
    "lastUpdateDate": "2024-01-15T08:00:00.000Z",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 2. Get All Foodstuffs

**Endpoint**: `GET /foodstuffs`

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name
- `sortBy` (optional): Sort field (default: name)
- `sortOrder` (optional): Sort order - asc/desc (default: asc)

**Response**:

```json
{
  "message": "Foodstuffs retrieved successfully",
  "data": {
    "foodstuffs": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Rice",
        "unit": "kg",
        "currentQuantity": 100.5,
        "averageCostPrice": 850,
        "lastUpdateDate": "2024-01-15T08:00:00.000Z",
        "createdAt": "2024-01-15T08:00:00.000Z",
        "updatedAt": "2024-01-15T08:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 3. Get Foodstuff by ID

**Endpoint**: `GET /foodstuffs/:id`

**Response**:

```json
{
  "message": "Foodstuff retrieved successfully",
  "foodstuff": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Rice",
    "unit": "kg",
    "currentQuantity": 100.5,
    "averageCostPrice": 850,
    "lastUpdateDate": "2024-01-15T08:00:00.000Z",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 4. Update Foodstuff

**Endpoint**: `PUT /foodstuffs/:id`

**Request Payload**:

```json
{
  "name": "Premium Rice",
  "unit": "kg"
}
```

**Response**:

```json
{
  "message": "Foodstuff updated successfully",
  "foodstuff": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Premium Rice",
    "unit": "kg",
    "currentQuantity": 100.5,
    "averageCostPrice": 850,
    "lastUpdateDate": "2024-01-15T08:00:00.000Z",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 5. Delete Foodstuff

**Endpoint**: `DELETE /foodstuffs/:id`

**Response**:

```json
{
  "message": "Foodstuff deleted successfully"
}
```

---

### 6. Add Foodstuff Activity

**Endpoint**: `POST /foodstuffs/:id/activities`

**Description**: Add purchase, usage, wastage, or correction activity to a foodstuff

**Request Payload (Purchase)**:

```json
{
  "actionType": "purchase",
  "quantityChanged": 50.0,
  "unitCost": 800,
  "totalCost": 40000,
  "reason": "Weekly stock replenishment"
}
```

**Request Payload (Usage)**:

```json
{
  "actionType": "usage",
  "quantityChanged": -10.5,
  "reason": "Used for Jollof Rice preparation",
  "cookedFoodNameId": "507f1f77bcf86cd799439011",
  "requisitionId": "507f1f77bcf86cd799439030"
}
```

**Response**:

```json
{
  "message": "Activity added successfully",
  "activity": {
    "_id": "507f1f77bcf86cd799439025",
    "foodstuffId": "507f1f77bcf86cd799439020",
    "actionType": "usage",
    "quantityChanged": -10.5,
    "reason": "Used for Jollof Rice preparation",
    "cookedFoodNameId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jollof Rice",
      "description": "Traditional Nigerian rice dish"
    },
    "requisitionId": {
      "_id": "507f1f77bcf86cd799439030",
      "requisitionNumber": "REQ-2024-0001"
    },
    "doneBy": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T08:00:00.000Z"
  },
  "updatedFoodstuff": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Rice",
    "currentQuantity": 90.0,
    "averageCostPrice": 850
  }
}
```

---

### 7. Get Foodstuff Activities

**Endpoint**: `GET /foodstuffs/:id/activities`

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `actionType` (optional): Filter by action type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**:

```json
{
  "message": "Activities retrieved successfully",
  "data": {
    "activities": [
      {
        "_id": "507f1f77bcf86cd799439025",
        "actionType": "usage",
        "quantityChanged": -10.5,
        "reason": "Used for Jollof Rice preparation",
        "cookedFoodNameId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Jollof Rice"
        },
        "doneBy": {
          "_id": "507f1f77bcf86cd799439013",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2024-01-15T08:00:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 8. Get Foodstuffs Dashboard

**Endpoint**: `GET /foodstuffs/dashboard`

**Response**:

```json
{
  "message": "Dashboard data retrieved successfully",
  "data": {
    "totalFoodstuffs": 25,
    "lowStockItems": 5,
    "totalValue": 125000,
    "recentActivities": 15,
    "topFoodstuffs": [
      {
        "name": "Rice",
        "currentQuantity": 100.5,
        "value": 85425
      }
    ]
  }
}
```

---

### 9. Get Stock Alerts

**Endpoint**: `GET /foodstuffs/stock-alerts`

**Response**:

```json
{
  "message": "Stock alerts retrieved successfully",
  "alerts": [
    {
      "foodstuff": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Rice",
        "currentQuantity": 5.0,
        "unit": "kg"
      },
      "alertLevel": "low",
      "recommendedAction": "Reorder soon"
    }
  ]
}
```

---

# FOODSTUFF REQUISITIONS ENDPOINTS

## Base URL: `/requisitions`

### 1. Create Requisition

**Endpoint**: `POST /requisitions`

**Description**: Create a new foodstuff requisition for a specific cooked food

**Request Payload**:

```json
{
  "cookedFoodNameId": "507f1f77bcf86cd799439011",
  "priority": "medium",
  "requiredDate": "2024-01-20T08:00:00.000Z",
  "notes": "For weekend special menu",
  "items": [
    {
      "foodstuffId": "507f1f77bcf86cd799439020",
      "requestedQuantity": 25.0,
      "unit": "kg",
      "notes": "Premium quality rice needed"
    },
    {
      "foodstuffId": "507f1f77bcf86cd799439021",
      "requestedQuantity": 5.0,
      "unit": "liters",
      "notes": "Extra virgin olive oil"
    }
  ]
}
```

**Response**:

```json
{
  "message": "Requisition created successfully",
  "requisition": {
    "_id": "507f1f77bcf86cd799439030",
    "requisitionNumber": "REQ-2024-0001",
    "cookedFoodNameId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jollof Rice",
      "description": "Traditional Nigerian rice dish"
    },
    "requestedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "status": "pending",
    "priority": "medium",
    "requiredDate": "2024-01-20T08:00:00.000Z",
    "notes": "For weekend special menu",
    "items": [
      {
        "foodstuffId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Rice",
          "unit": "kg"
        },
        "requestedQuantity": 25.0,
        "unit": "kg",
        "notes": "Premium quality rice needed"
      }
    ],
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 2. Get All Requisitions

**Endpoint**: `GET /requisitions`

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending, approved, rejected, fulfilled)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `cookedFoodNameId` (optional): Filter by cooked food name
- `startDate` (optional): Filter by creation start date
- `endDate` (optional): Filter by creation end date

**Response**:

```json
{
  "message": "Requisitions retrieved successfully",
  "data": {
    "requisitions": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "requisitionNumber": "REQ-2024-0001",
        "cookedFoodNameId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Jollof Rice"
        },
        "requestedBy": {
          "_id": "507f1f77bcf86cd799439013",
          "firstName": "John",
          "lastName": "Doe"
        },
        "status": "pending",
        "priority": "medium",
        "requiredDate": "2024-01-20T08:00:00.000Z",
        "items": [
          {
            "foodstuffId": {
              "name": "Rice",
              "unit": "kg"
            },
            "requestedQuantity": 25.0,
            "approvedQuantity": 20.0,
            "fulfilledQuantity": 0
          }
        ],
        "createdAt": "2024-01-15T08:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 3. Get Requisition by ID

**Endpoint**: `GET /requisitions/:id`

**Response**:

```json
{
  "message": "Requisition retrieved successfully",
  "requisition": {
    "_id": "507f1f77bcf86cd799439030",
    "requisitionNumber": "REQ-2024-0001",
    "cookedFoodNameId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jollof Rice",
      "description": "Traditional Nigerian rice dish"
    },
    "requestedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "status": "pending",
    "priority": "medium",
    "requiredDate": "2024-01-20T08:00:00.000Z",
    "notes": "For weekend special menu",
    "items": [
      {
        "foodstuffId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Rice",
          "unit": "kg"
        },
        "requestedQuantity": 25.0,
        "unit": "kg",
        "notes": "Premium quality rice needed"
      }
    ],
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 4. Update Requisition

**Endpoint**: `PUT /requisitions/:id`

**Description**: Update a pending requisition

**Request Payload**:

```json
{
  "priority": "high",
  "requiredDate": "2024-01-18T08:00:00.000Z",
  "notes": "Urgent - for special event",
  "items": [
    {
      "foodstuffId": "507f1f77bcf86cd799439020",
      "requestedQuantity": 30.0,
      "unit": "kg",
      "notes": "Increased quantity needed"
    }
  ]
}
```

**Response**:

```json
{
  "message": "Requisition updated successfully",
  "requisition": {
    "_id": "507f1f77bcf86cd799439030",
    "requisitionNumber": "REQ-2024-0001",
    "priority": "high",
    "requiredDate": "2024-01-18T08:00:00.000Z",
    "notes": "Urgent - for special event",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 5. Approve Requisition

**Endpoint**: `PUT /requisitions/:id/approve`

**Description**: Approve a pending requisition with approved quantities

**Request Payload**:

```json
{
  "items": [
    {
      "foodstuffId": "507f1f77bcf86cd799439020",
      "approvedQuantity": 20.0
    }
  ],
  "notes": "Approved with reduced quantity due to stock levels"
}
```

**Response**:

```json
{
  "message": "Requisition approved successfully",
  "requisition": {
    "_id": "507f1f77bcf86cd799439030",
    "requisitionNumber": "REQ-2024-0001",
    "status": "approved",
    "approvedBy": {
      "_id": "507f1f77bcf86cd799439014",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "approvedAt": "2024-01-15T12:00:00.000Z",
    "items": [
      {
        "foodstuffId": {
          "name": "Rice",
          "unit": "kg"
        },
        "requestedQuantity": 25.0,
        "approvedQuantity": 20.0
      }
    ]
  }
}
```

---

### 6. Reject Requisition

**Endpoint**: `PUT /requisitions/:id/reject`

**Description**: Reject a pending requisition

**Request Payload**:

```json
{
  "rejectionReason": "Insufficient stock available and no immediate restock planned"
}
```

**Response**:

```json
{
  "message": "Requisition rejected successfully",
  "requisition": {
    "_id": "507f1f77bcf86cd799439030",
    "requisitionNumber": "REQ-2024-0001",
    "status": "rejected",
    "approvedBy": {
      "_id": "507f1f77bcf86cd799439014",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "approvedAt": "2024-01-15T12:00:00.000Z",
    "rejectionReason": "Insufficient stock available and no immediate restock planned"
  }
}
```

---

### 7. Fulfill Requisition

**Endpoint**: `PUT /requisitions/:id/fulfill`

**Description**: Fulfill an approved requisition by issuing the materials

**Request Payload**:

```json
{
  "items": [
    {
      "foodstuffId": "507f1f77bcf86cd799439020",
      "fulfilledQuantity": 20.0,
      "reason": "Issued for Jollof Rice preparation - Weekend special"
    }
  ]
}
```

**Response**:

```json
{
  "message": "Requisition fulfilled successfully",
  "requisition": {
    "_id": "507f1f77bcf86cd799439030",
    "requisitionNumber": "REQ-2024-0001",
    "status": "fulfilled",
    "fulfilledAt": "2024-01-15T14:00:00.000Z",
    "items": [
      {
        "foodstuffId": {
          "name": "Rice",
          "unit": "kg"
        },
        "requestedQuantity": 25.0,
        "approvedQuantity": 20.0,
        "fulfilledQuantity": 20.0
      }
    ]
  }
}
```

---

### 8. Delete Requisition

**Endpoint**: `DELETE /requisitions/:id`

**Description**: Delete a requisition (cannot delete fulfilled requisitions)

**Response**:

```json
{
  "message": "Requisition deleted successfully"
}
```

---

# COOKED FOOD NAMES ENDPOINTS

## Base URL: `/cooked-food-names`

### 1. Create Cooked Food Name

**Endpoint**: `POST /cooked-food-names`

**Request Payload**:

```json
{
  "name": "Jollof Rice",
  "description": "Traditional Nigerian rice dish"
}
```

**Response**:

```json
{
  "message": "Cooked food name created successfully",
  "cookedFoodName": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jollof Rice",
    "description": "Traditional Nigerian rice dish",
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 2. Get All Cooked Food Names

**Endpoint**: `GET /cooked-food-names`

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name
- `isActive` (optional): Filter by active status

**Response**:

```json
{
  "message": "Cooked food names retrieved successfully",
  "data": {
    "cookedFoodNames": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Jollof Rice",
        "description": "Traditional Nigerian rice dish",
        "isActive": true,
        "createdAt": "2024-01-15T08:00:00.000Z",
        "updatedAt": "2024-01-15T08:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 3. Get Cooked Food Name by ID

**Endpoint**: `GET /cooked-food-names/:id`

**Response**:

```json
{
  "message": "Cooked food name retrieved successfully",
  "cookedFoodName": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jollof Rice",
    "description": "Traditional Nigerian rice dish",
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 4. Update Cooked Food Name

**Endpoint**: `PUT /cooked-food-names/:id`

**Request Payload**:

```json
{
  "name": "Special Jollof Rice",
  "description": "Premium Nigerian rice dish",
  "isActive": true
}
```

**Response**:

```json
{
  "message": "Cooked food name updated successfully",
  "cookedFoodName": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Special Jollof Rice",
    "description": "Premium Nigerian rice dish",
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 5. Delete Cooked Food Name

**Endpoint**: `DELETE /cooked-food-names/:id`

**Response**:

```json
{
  "message": "Cooked food name deleted successfully"
}
```

---

### 6. Get Cooked Food Names Dropdown

**Endpoint**: `GET /cooked-food-names/dropdown`

**Description**: Get active cooked food names for dropdown selection

**Response**:

```json
{
  "message": "Cooked food names retrieved successfully",
  "names": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jollof Rice"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Fried Rice"
    }
  ]
}
```

---

# COOKED FOOD RECORDS ENDPOINTS

## Base URL: `/cooked-foods`

### 1. Create Cooked Food Record

**Endpoint**: `POST /cooked-foods`

**Description**: Create a new cooked food preparation record

**Request Payload**:

```json
{
  "cookedFoodNameId": "507f1f77bcf86cd799439011",
  "preparedQuantityKg": 25.5,
  "preparationDate": "2024-01-15T08:00:00.000Z",
  "notes": "Extra spicy today"
}
```

**Response**:

```json
{
  "message": "Cooked food record created successfully",
  "cookedFood": {
    "_id": "507f1f77bcf86cd799439012",
    "cookedFoodNameId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jollof Rice",
      "description": "Traditional Nigerian rice dish"
    },
    "preparedQuantityKg": 25.5,
    "soldQuantityKg": 0,
    "leftoverQuantityKg": 25.5,
    "preparationDate": "2024-01-15T08:00:00.000Z",
    "preparedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "notes": "Extra spicy today",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

---

### 2. Get All Cooked Food Records

**Endpoint**: `GET /cooked-foods`

**Description**: Retrieve all cooked food records with filtering and pagination

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `cookedFoodNameId` (optional): Filter by cooked food name ID
- `startDate` (optional): Filter by preparation start date
- `endDate` (optional): Filter by preparation end date
- `sortBy` (optional): Sort field (default: preparationDate)
- `sortOrder` (optional): Sort order - asc/desc (default: desc)

**Example Request**: `GET /cooked-foods?page=1&limit=10&sortBy=preparationDate&sortOrder=desc`

**Response**:

```json
{
  "message": "Cooked foods retrieved successfully",
  "data": {
    "cookedFoods": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "cookedFoodNameId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Jollof Rice",
          "description": "Traditional Nigerian rice dish"
        },
        "preparedQuantityKg": 25.5,
        "soldQuantityKg": 20.0,
        "leftoverQuantityKg": 5.5,
        "preparationDate": "2024-01-15T08:00:00.000Z",
        "preparedBy": {
          "_id": "507f1f77bcf86cd799439013",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "notes": "Extra spicy today",
        "createdAt": "2024-01-15T08:00:00.000Z",
        "updatedAt": "2024-01-15T12:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 3. Get Cooked Food Dashboard

**Endpoint**: `GET /cooked-foods/dashboard`

**Description**: Get comprehensive dashboard statistics and data for cooked foods

**Response**:

```json
{
  "message": "Cooked food dashboard data retrieved successfully",
  "data": {
    "stats": {
      "totalCookedFoods": 150,
      "lowStockItems": 5,
      "totalValue": 75000,
      "recentPreparations": 25,
      "recentSales": 20,
      "recentWastage": 0,
      "monthlyRevenue": 125000,
      "pendingRequisitions": 3
    },
    "stockAlerts": [
      {
        "cookedFood": {
          "_id": "507f1f77bcf86cd799439012",
          "cookedFoodNameId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Jollof Rice"
          },
          "preparedQuantityKg": 25.5,
          "soldQuantityKg": 24.0,
          "leftoverQuantityKg": 1.5,
          "preparationDate": "2024-01-15T08:00:00.000Z"
        },
        "alertLevel": "low",
        "recommendedAction": "Consider preparing more soon"
      }
    ],
    "recentActivities": [],
    "recentRequisitions": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "requisitionNumber": "REQ-2024-0001",
        "cookedFoodNameId": {
          "name": "Jollof Rice"
        },
        "status": "pending",
        "priority": "medium",
        "createdAt": "2024-01-15T08:00:00.000Z"
      }
    ],
    "monthlyRevenueByFood": [
      {
        "cookedFoodName": "Jollof Rice",
        "totalRevenue": 45000
      },
      {
        "cookedFoodName": "Fried Rice",
        "totalRevenue": 35000
      }
    ]
  }
}
```

---

### 4. Get Cooked Food by ID

**Endpoint**: `GET /cooked-foods/:id`

**Description**: Retrieve a specific cooked food record by ID

**Response**:

```json
{
  "message": "Cooked food retrieved successfully",
  "cookedFood": {
    "_id": "507f1f77bcf86cd799439012",
    "cookedFoodNameId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jollof Rice",
      "description": "Traditional Nigerian rice dish"
    },
    "preparedQuantityKg": 25.5,
    "soldQuantityKg": 20.0,
    "leftoverQuantityKg": 5.5,
    "preparationDate": "2024-01-15T08:00:00.000Z",
    "preparedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "notes": "Extra spicy today",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

### 5. Update Cooked Food Record

**Endpoint**: `PUT /cooked-foods/:id`

**Description**: Update sold/leftover quantities and notes for a cooked food record

**Request Payload**:

```json
{
  "soldQuantityKg": 20.0,
  "leftoverQuantityKg": 5.5,
  "notes": "Updated notes"
}
```

**Response**:

```json
{
  "message": "Cooked food record updated successfully",
  "cookedFood": {
    "_id": "507f1f77bcf86cd799439012",
    "cookedFoodNameId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jollof Rice",
      "description": "Traditional Nigerian rice dish"
    },
    "preparedQuantityKg": 25.5,
    "soldQuantityKg": 20.0,
    "leftoverQuantityKg": 5.5,
    "preparationDate": "2024-01-15T08:00:00.000Z",
    "preparedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "notes": "Updated notes",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T14:00:00.000Z"
  }
}
```

---

### 6. Delete Cooked Food Record

**Endpoint**: `DELETE /cooked-foods/:id`

**Description**: Delete a cooked food record

**Response**:

```json
{
  "message": "Cooked food record deleted successfully"
}
```

---

### 7. Get Cooked Food Statistics

**Endpoint**: `GET /cooked-foods/stats`

**Description**: Get daily statistics for cooked foods

**Response**:

```json
{
  "message": "Cooked food statistics retrieved successfully",
  "data": {
    "totalPreparedToday": 150.5,
    "totalSoldToday": 120.0,
    "totalLeftoverToday": 30.5,
    "mostPreparedFood": "Jollof Rice",
    "totalWastePercentage": 20.26
  }
}
```

---

# ERROR RESPONSES

All endpoints may return the following error responses:

**400 Bad Request**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
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

**404 Not Found**:

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

**500 Internal Server Error**:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

# WORKFLOW EXAMPLES

## Complete Requisition to Usage Workflow

### 1. Create Requisition for Jollof Rice

```
POST /requisitions
{
  "cookedFoodNameId": "507f1f77bcf86cd799439011",
  "priority": "medium",
  "requiredDate": "2024-01-20T08:00:00.000Z",
  "items": [
    {
      "foodstuffId": "507f1f77bcf86cd799439020",
      "requestedQuantity": 25.0,
      "unit": "kg"
    }
  ]
}
```

### 2. Approve Requisition

```
PUT /requisitions/507f1f77bcf86cd799439030/approve
{
  "items": [
    {
      "foodstuffId": "507f1f77bcf86cd799439020",
      "approvedQuantity": 20.0
    }
  ]
}
```

### 3. Fulfill Requisition (Creates Usage Activity)

```
PUT /requisitions/507f1f77bcf86cd799439030/fulfill
{
  "items": [
    {
      "foodstuffId": "507f1f77bcf86cd799439020",
      "fulfilledQuantity": 20.0,
      "reason": "Used for Jollof Rice preparation"
    }
  ]
}
```

### 4. Create Cooked Food Record

```
POST /cooked-foods
{
  "cookedFoodNameId": "507f1f77bcf86cd799439011",
  "preparedQuantityKg": 25.5,
  "notes": "Prepared using requisitioned materials"
}
```

This workflow ensures complete traceability from raw material requisition to final cooked food preparation.
