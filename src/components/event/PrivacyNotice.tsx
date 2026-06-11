export function PrivacyNotice({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <label className="flex gap-3 rounded-lg bg-slate-100 p-4 text-sm leading-6 text-slate-700">
      <input
        className="mt-1 h-4 w-4 shrink-0 accent-red-700"
        defaultChecked={defaultChecked}
        name="privacyAgreed"
        type="checkbox"
      />
      <span>
        이벤트 참여, 경기별 중복 확인, 당첨자 연락을 위해 닉네임과 휴대폰
        번호를 처리하는 데 동의합니다. 관리자 화면에는 마스킹된 번호만
        표시되며, 실제 당첨자에게 알림 문자를 보내야 할 때에만 서버에서
        복호화된 번호를 CSV로 확인합니다.
      </span>
    </label>
  );
}
