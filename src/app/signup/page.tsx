import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect(
    "/login?error=공개 회원가입은 비활성화되어 있습니다. 관리자에게 계정 발급을 요청하세요.",
  );
}
