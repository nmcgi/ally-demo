interface WizardNavProps {
  onBack: (() => void) | null;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export function WizardNav({ onBack, nextDisabled, nextLabel = 'Continue' }: WizardNavProps) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      ) : (
        <div className="flex-1" />
      )}
      <button
        type="submit"
        disabled={nextDisabled}
        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextLabel}
      </button>
    </div>
  );
}
