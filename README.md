# Inventory Management

Next.js 14 기반의 학교/조직용 재고 관리 시스템입니다. PIN 기반 일반 사용자 로그인과 관리자 로그인을 분리하고, 물품 등록/조회/사용/이동/폐기/복구/사용자 관리를 제공합니다.

## Requirements

- Node.js 20+
- pnpm
- SQLite
- `school-floor-map` 패키지: 현재 `package.json`에서 `link:../school-floor-map`로 참조합니다. 같은 상위 디렉터리에 해당 패키지가 있어야 지도 페이지가 빌드됩니다.

## Setup

```bash
pnpm install
cp .env.example .env # 없으면 아래 환경 변수를 직접 생성
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
```

`.env` 예시:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
```

## Development

```bash
pnpm dev
pnpm lint
pnpm build
```

## Seed Accounts

- 관리자: `admin@example.com` / `admin123`
- 일반 사용자 PIN: `1234`

## Notes

- 로컬 SQLite DB(`prisma/dev.db`)는 커밋하지 않습니다.
- lockfile은 `pnpm-lock.yaml`만 사용합니다.
- 폐기 목록은 완전 폐기(`status = DISPOSED`)된 물품만 표시합니다. 부분 폐기는 각 물품 상세 이력에서 확인합니다.
