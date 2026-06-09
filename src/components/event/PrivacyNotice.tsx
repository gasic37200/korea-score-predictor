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
        이벤트 참여와 중복 확인을 위해 닉네임과 휴대폰 번호를 처리하는 데
        동의합니다. 휴대폰 번호는 서버에서 해시 처리되며 관리자 화면에는
        마스킹된 값만 표시됩니다.
      </span>
    </label>
  );
}
