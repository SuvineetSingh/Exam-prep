/**
 * Facebook-style presence indicator: small green dot pinned to the
 * bottom-right corner of an avatar. The parent element must be `relative`.
 */
export function OnlineDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white online-dot" />
  );
}
