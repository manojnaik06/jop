# Filtering, Search & Pagination API Guide

## Overview
All GET endpoints support scalable querying through filtering, search, and pagination parameters.

---

## Global Query Parameters

### Pagination Parameters
```
page         (integer, default: 1)      - Page number for pagination
limit        (integer, default: 10)     - Records per page
sortBy       (string, default: varies)  - Field to sort by
sortOrder    (integer, default: -1)     - Sort direction: 1 (asc), -1 (desc)
```

### Response Format
All paginated responses include:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": {
    "records": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

---

## Section F - Detailed Filtering Examples

### 12. Student APIs

#### Get all students with filters
**Endpoint**: `GET /api/students`

**Query Parameters:**
- `search` - Search by name, email, or roll number (case-insensitive)
- `department` - Filter by department (e.g., CSE, ECE, ME)
- `status` - Filter by status: `active`, `inactive`, `placed`
- `cgpaMin` - Filter students with CGPA >= value (0-10)
- `cgpaMax` - Filter students with CGPA <= value (0-10)
- `sortBy` - Sort by field (default: `createdAt`)
- `sortOrder` - 1 for ascending, -1 for descending

**Examples:**

1. Get CSE department students:
```bash
GET /api/students?department=CSE&limit=20&page=1
```

2. Get active students with CGPA >= 8:
```bash
GET /api/students?cgpaMin=8&status=active
```

3. Get placed students sorted by CGPA (descending):
```bash
GET /api/students?status=placed&sortBy=cgpa&sortOrder=-1
```

4. Search for students with name containing "Arun":
```bash
GET /api/students?search=Arun&limit=10&page=1
```

5. Complex filter - CSE students with 8 <= CGPA <= 9:
```bash
GET /api/students?department=CSE&cgpaMin=8&cgpaMax=9&limit=15
```

---

### 13. Drive APIs

#### Get all placement drives with filters
**Endpoint**: `GET /api/drives`

**Query Parameters:**
- `search` - Search by drive title (case-insensitive)
- `status` - Filter by status: `active`, `closed`
- `company` - Filter by company ID or company name
- `mode` - Filter by mode: `on-campus`, `off-campus`, `online`
- `sortBy` - Sort by field (default: `createdAt`)
- `sortOrder` - 1 for ascending, -1 for descending

**Examples:**

1. Get all active placement drives:
```bash
GET /api/drives?status=active&limit=20
```

2. Get drives from specific company (by company ID):
```bash
GET /api/drives?company=665f1a2b3c4d5e6f7g8h9i0j
```

3. Get on-campus drives sorted by registration deadline:
```bash
GET /api/drives?mode=on-campus&sortBy=registrationDeadline&limit=10
```

4. Search drives by title "Frontend":
```bash
GET /api/drives?search=Frontend&limit=15&page=1
```

5. Complex filter - Active TechNova company drives (by company name):
```bash
GET /api/drives?company=TechNova&status=active&limit=20
```

---

### 14. Application APIs

#### Get all applications with filters, search, and pagination
**Endpoint**: `GET /api/applications`

**Query Parameters:**
- `search` - Search by student name, email, roll number, or company name
- `status` - Filter by status: `applied`, `shortlisted`, `selected`, `rejected`
- `drive` - Filter by drive ID
- `cgpaMin` - Filter applications with student CGPA >= value
- `cgpaMax` - Filter applications with student CGPA <= value
- `sortBy` - Sort by field (default: `appliedAt`)
- `sortOrder` - 1 for ascending, -1 for descending

**Examples:**

1. Get page 1 with 10 applications:
```bash
GET /api/applications?page=1&limit=10
```

2. Get shortlisted applications:
```bash
GET /api/applications?status=shortlisted&limit=10
```

3. Get applications for specific drive:
```bash
GET /api/applications?drive=665f1a2b3c4d5e6f7g8h9i0j&limit=10
```

4. Search for applications by student name "Arun":
```bash
GET /api/applications?search=Arun&limit=10
```

5. Search by company name "TechNova":
```bash
GET /api/applications?search=TechNova&limit=10
```

6. **COMBINED QUERY** - Shortlisted applications on page 2 with 5 per page:
```bash
GET /api/applications?status=shortlisted&page=2&limit=5
```

7. **COMPLEX COMBINED** - Shortlisted applications from TechNova drive with student CGPA >= 8:
```bash
GET /api/applications?status=shortlisted&search=TechNova&cgpaMin=8&page=1&limit=10
```

8. Get selected applications sorted by applied date (newest first):
```bash
GET /api/applications?status=selected&sortBy=appliedAt&sortOrder=-1&limit=20
```

---

### Company APIs

#### Get all companies with filters
**Endpoint**: `GET /api/companies`

**Query Parameters:**
- `search` - Search by company name
- `status` - Filter by status: `active`, `inactive`
- `sortBy` - Sort by field (default: `createdAt`)
- `sortOrder` - 1 for ascending, -1 for descending

**Examples:**

1. Get all active companies:
```bash
GET /api/companies?status=active&limit=20
```

2. Search for TechNova company:
```bash
GET /api/companies?search=TechNova
```

3. Get inactive companies:
```bash
GET /api/companies?status=inactive&limit=10&page=1
```

---

### Interview APIs

#### Get all interviews with filters
**Endpoint**: `GET /api/interviews`

**Query Parameters:**
- `search` - Search by student name or email
- `application` - Filter by application ID
- `result` - Filter by result: `pending`, `passed`, `failed`
- `sortBy` - Sort by field (default: `scheduledAt`)
- `sortOrder` - 1 for ascending, -1 for descending

**Examples:**

1. Get pending interviews:
```bash
GET /api/interviews?result=pending&limit=10
```

2. Get interviews for specific application:
```bash
GET /api/interviews?application=665f1a2b3c4d5e6f7g8h9i0j
```

3. Search interviews for student "Arun":
```bash
GET /api/interviews?search=Arun&limit=10
```

4. Get interviews on page 2 with 5 per page:
```bash
GET /api/interviews?page=2&limit=5
```

---

## Best Practices

1. **Always specify `limit`** to prevent huge result sets
2. **Use `page` parameter** for navigating through large datasets
3. **Combine filters** to narrow down results efficiently
4. **Check `hasMore`** in pagination response to know if more pages exist
5. **Use `sortBy` and `sortOrder`** for consistent ordering
6. **URL encode** special characters in search values
7. **Case-insensitive** search works for all text fields

---

## Implementation Notes

- All filters are **optional** and can be combined
- All searches are **case-insensitive**
- MongoDB ObjectId validation is automatic for ID filters
- Invalid filter values are ignored (e.g., invalid status)
- CGPA ranges are validated (0-10)
- Default page size is 10 records
- Maximum recommended limit is 100 records per page

---

## Code Examples

### JavaScript/Fetch
```javascript
// Search for shortlisted applications from TechNova
const response = await fetch('/api/applications?status=shortlisted&search=TechNova&page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data.data.applications);
```

### cURL
```bash
curl -X GET \
  'http://localhost:5000/api/applications?status=shortlisted&page=1&limit=10' \
  -H 'Authorization: Bearer <token>'
```

### Axios
```javascript
axios.get('/api/applications', {
  params: {
    status: 'shortlisted',
    search: 'TechNova',
    page: 1,
    limit: 10
  },
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => console.log(res.data.data));
```
