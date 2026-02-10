import Link from "next/link";

interface IntegrationsRequiredModalProps {
  isOpen: boolean;
  username: string;
  message: string;
  onClose: () => void;
}

export default function IntegrationsRequiredModal({
  isOpen,
  username,
  message,
  onClose,
}: IntegrationsRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
              Integrations Required
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <Link
            href={`/${username}/admin/settings?tab=integrations`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Integrations
          </Link>
        </div>
      </div>
    </div>
  );
}
