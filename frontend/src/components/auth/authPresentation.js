import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const submitStyles =
  'w-full cursor-pointer rounded-md border-0 bg-workly-primary dark:bg-transparent p-3 text-base leading-[normal] font-semibold text-white transition-colors hover:bg-[#038a3d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-workly-primary dark:bg-[linear-gradient(135deg,#0fce6a,#0aa85a)] dark:shadow-[0_14px_32px_rgba(15,206,106,0.28),0_0_0_1px_rgba(15,206,106,0.12)]';
export const registrationSubmitStyles =
  'mt-2.5 w-full cursor-pointer rounded border-0 bg-[#4caf50] dark:bg-transparent p-3 text-[13.3333px] leading-[normal] font-bold text-white hover:bg-[#45a049] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-workly-primary legacy-max-576:p-2.5 dark:bg-[linear-gradient(135deg,#0fce6a,#0aa85a)] dark:shadow-[0_14px_32px_rgba(15,206,106,0.28),0_0_0_1px_rgba(15,206,106,0.12)]';
export const linkStyles =
  'text-workly-primary hover:text-[#038a3d] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-workly-primary dark:text-workly-dark-text';
export const glow =
  '[filter:drop-shadow(0_0_3px_rgba(0,255,123,0.95))_drop-shadow(0_0_8px_rgba(0,255,123,0.72))_drop-shadow(0_0_16px_rgba(0,255,123,0.48))_drop-shadow(0_0_28px_rgba(0,255,123,0.28))] hover:[filter:drop-shadow(0_0_4px_rgba(0,255,123,1))_drop-shadow(0_0_11px_rgba(0,255,123,0.82))_drop-shadow(0_0_22px_rgba(0,255,123,0.55))_drop-shadow(0_0_36px_rgba(0,255,123,0.32))]';

export function showAuthAlert({ icon, title, text, confirmText = 'OK', cancelText }) {
  const dark = localStorage.getItem('darkMode') === 'enabled';
  const opener = document.activeElement;
  return Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: confirmText,
    showCancelButton: Boolean(cancelText),
    cancelButtonText: cancelText,
    allowOutsideClick: true,
    heightAuto: false,
    buttonsStyling: false,
    returnFocus: false,
    backdrop: 'rgba(4,10,20,0.46)',
    showClass: { popup: 'animate-workly-modal-in' },
    hideClass: { popup: 'animate-workly-modal-out' },
    customClass: {
      container: 'z-[25000]! p-[18px]! backdrop-blur-[8px]',
      popup: `w-[min(440px,calc(100vw-34px))]! rounded-[24px]! border! border-[rgba(148,163,184,0.18)]! px-7! pt-[30px]! pb-[26px]! font-workly! leading-[normal]! tracking-[0]! bg-transparent! overflow-hidden! ${dark ? 'bg-[radial-gradient(circle_at_50%_-20%,rgba(74,222,128,0.12),transparent_38%),linear-gradient(160deg,rgba(11,20,36,0.99),rgba(9,15,29,0.99))]! text-workly-dark-text! shadow-[0_36px_100px_rgba(0,4,18,0.64)]!' : 'bg-[radial-gradient(circle_at_50%_-20%,rgba(4,191,85,0.10),transparent_38%),linear-gradient(180deg,#ffffff,#f8fbff)]! text-workly-text! shadow-[0_30px_90px_rgba(15,23,42,0.28)]!'}`,
      title: `mt-1! mb-2.5! p-0! font-workly! text-[1.8rem]! legacy-max-580:text-[1.45rem]! leading-[1.12]! font-black! ${dark ? 'text-[#f2f7ff]!' : 'text-[#0f172a]!'}`,
      htmlContainer: `mx-auto! mt-0! mb-[22px]! max-w-[340px]! font-workly! text-[0.98rem]! leading-[1.55]! font-medium! ${dark ? 'text-[#a9b9cf]!' : 'text-[#64748b]!'}`,
      icon: `h-[78px]! w-[78px]! mt-1! mx-auto! mb-[18px]! border-[3px]! ${icon === 'success' ? 'border-[rgba(34,197,94,0.34)]! text-[#16a34a]! bg-[rgba(34,197,94,0.07)]! [&_[class^=swal2-success-line]]:bg-[#22c55e]!' : icon === 'error' ? 'border-[rgba(239,68,68,0.28)]! text-[#ef4444]! bg-[rgba(239,68,68,0.06)]!' : 'border-[rgba(245,158,11,0.30)]! text-[#f59e0b]! bg-[rgba(245,158,11,0.08)]!'}`,
      actions: 'mt-1! gap-2.5!',
      cancelButton:
        'min-h-12 rounded-[14px] border-0 bg-[#e2e8f0] px-[22px] font-workly font-bold text-[#334155] focus-visible:outline-2 focus-visible:outline-workly-primary',
      confirmButton:
        'min-w-[124px] min-h-12 rounded-[14px] border-0 bg-[linear-gradient(135deg,#13ce66,#04bf55)] px-[22px] font-workly text-[0.94rem] leading-[normal] font-black text-white shadow-[0_14px_30px_rgba(4,191,85,0.24)] hover:-translate-y-px hover:brightness-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-workly-primary'
    }
  }).then((result) => {
    if (opener?.isConnected) opener.focus();
    return result;
  });
}
