# TypeScript 타입 정의 가이드

Supabase 연결 준비를 위한 깔끔한 타입 시스템이 완성되었습니다.

## 📁 폴더 구조

```
src/shared/types/
├── index.ts          # 모든 타입 통합 export
├── enums.ts          # Enum 정의
├── database.ts       # DB 테이블 타입
├── api.ts            # API request/response
└── ui.ts             # UI 컴포넌트 타입
```

## 🔑 주요 타입들

### Enums (`enums.ts`)

```typescript
import { UserRole, TransactionType, SerialStatus } from "@/shared/types";

UserRole.ADMIN; // 'admin'
UserRole.USER; // 'user'

TransactionType.IN; // 'IN'
TransactionType.OUT; // 'OUT'
TransactionType.TRANSFER; // 'TRANSFER'
TransactionType.DISPOSE; // 'DISPOSE'

SerialStatus.AVAILABLE; // 'AVAILABLE'
SerialStatus.IN_USE; // 'IN_USE'
SerialStatus.DISPOSED; // 'DISPOSED'
```

### 데이터베이스 타입 (`database.ts`)

```typescript
import type {
  User,
  Item,
  Warehouse,
  Inventory,
  Transaction,
  ItemSerial,
} from "@/shared/types";

// 사용자
const user: User = {
  id: "123",
  email: "user@example.com",
  full_name: "홍길동",
  role: UserRole.USER,
  created_at: "2024-01-01",
};

// 물품
const item: Item = {
  id: "123",
  name: "맥북 M4",
  category: "노트북",
  barcode: "ABC123",
  has_serial_number: true,
  has_service_life: true,
  min_stock: 1,
  created_at: "2024-01-01",
};

// 재고
const inventory: Inventory = {
  id: "123",
  item_id: "456",
  warehouse_id: "789",
  quantity: 5,
  updated_at: "2024-01-01",
};
```

### API 타입 (`api.ts`)

```typescript
import type {
  InventoryAdjustmentRequest,
  CreateItemRequest,
  TransactionFilter,
} from "@/shared/types";

// 재고 조정 요청
const adjustRequest: InventoryAdjustmentRequest = {
  item_id: "123",
  warehouse_id: "456",
  type: TransactionType.OUT,
  serial_id: "789", // OR quantity: 5
  reason: "테스트 출고",
};

// 물품 생성 요청
const createItemRequest: CreateItemRequest = {
  name: "새로운 물품",
  category: "카테고리",
  has_serial_number: true,
  min_stock: 0,
};

// 거래 조회 필터
const filter: TransactionFilter = {
  type: TransactionType.OUT,
  start_date: "2024-01-01",
  limit: 100,
};
```

### UI 타입 (`ui.ts`)

```typescript
import type {
  InventoryGridItem,
  AdjustingItem,
  AdjustmentModalState,
} from "@/shared/types";

const gridItem: InventoryGridItem = {
  item_id: "123",
  warehouse_id: "456",
  quantity: 5,
  item_name: "맥북 M4",
  item_category: "노트북",
  item_min: 1,
  warehouse_name: "창고 1",
  has_serial_number: true,
};

const adjusting: AdjustingItem = {
  item_id: "123",
  warehouse_id: "456",
  name: "맥북 M4",
  has_serial_number: true,
};

const modalState: AdjustmentModalState = {
  quantity: 1,
  serial_id: "789",
  reason: "테스트",
  isDisposal: false,
  type: "OUT",
};
```

## 📤 사용 방법

### 1. 타입만 import하기

```typescript
import type { User, Item, Inventory } from "@/shared/types";

function processUser(user: User) {
  // ...
}
```

### 2. 타입 + Enum 함께 사용

```typescript
import { UserRole, TransactionType } from "@/shared/types";
import type { Transaction } from "@/shared/types";

const transaction: Transaction = {
  id: "123",
  item_id: "456",
  type: TransactionType.OUT,
  quantity: 5,
  created_at: "2024-01-01",
};
```

### 3. API 응답 처리

```typescript
import type { ApiResponse, Transaction } from "@/shared/types";

const res: ApiResponse<Transaction> = await fetch("/api/transactions/123");
if (res.success && res.data) {
  console.log(res.data.quantity);
}
```

## 🔄 Supabase 연결 체크리스트

Supabase 연결 후 다음을 확인하세요:

- [ ] Database 타입과 Supabase 테이블 필드명 일치 확인
- [ ] API 응답 타입이 Database 타입으로 캐스팅되는지 확인
- [ ] all enum values가 database에 존재하는지 확인
- [ ] API 요청/응답이 예상 타입과 일치하는지 테스트

## 🎯 주요 개선사항

✅ **타입 안정성**: 모든 데이터 구조를 명시적으로 정의  
✅ **IDE 자동완성**: 타입 정의로 더 나은 개발 경험  
✅ **런타임 안전**: Enum과 정확한 필드명으로 실수 방지  
✅ **유지보수성**: 중앙화된 타입 정의로 일관성 유지  
✅ **확장성**: 새로운 타입 추가 시 한 곳에서 관리

## 💡 팁

- Database 타입은 DB 스키마와 정확히 대응됨
- UI 타입은 컴포넌트 상태 관리용
- API 타입은 서버-클라이언트 통신용
- 새 테이블 추가 시 전체 타입 세트를 database.ts에 추가하면 자동으로 propagate됨
