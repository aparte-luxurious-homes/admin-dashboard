"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import CustomCheckbox from "@/components/ui/customCheckbox";
import { formatMoney } from "@/src/lib/utils";
import {
  CONTRIBUTORS_MAX_ALLOWED,
  CONTRIBUTORS_MIN_ALLOWED,
  DEFAULT_INSTALMENT_CONFIG,
  DEFAULT_INVITE_FRIENDS_CONFIG,
  FLEX_PAYMENTS_API_CONNECTED,
  FUNDING_WINDOW_HOURS,
  INITIAL_PERCENT_MAX,
  INITIAL_PERCENT_MIN,
  INITIAL_PERCENT_PRESETS,
  MAX_DEADLINE_DAYS_BEFORE_CHECKIN,
  equalShares,
  koboToNaira,
  splitInstalment,
  validateInstalmentConfig,
  validateInviteFriendsConfig,
} from "@/src/lib/flexPayments";
import {
  IInstalmentConfig,
  IInviteFriendsConfig,
} from "@/src/lib/types/flexPayments";

/** Worked example uses a round figure so the arithmetic is easy to eyeball. */
const EXAMPLE_TOTAL_KOBO = 20_000_000; // ₦200,000

interface Props {
  instalment: IInstalmentConfig | null;
  inviteFriends: IInviteFriendsConfig | null;
  onInstalmentChange: (next: IInstalmentConfig | null) => void;
  onInviteFriendsChange: (next: IInviteFriendsConfig | null) => void;
  /**
   * Agents may only configure these once the owner has said so (PRD 4.2).
   * `locked` renders everything read-only with an explanation.
   */
  locked: boolean;
  /** Owner/admin only: whether the property's agent may configure payments. */
  agentCanConfigure: boolean;
  onAgentCanConfigureChange?: (next: boolean) => void;
}

/**
 * A whole-number input that tolerates being emptied mid-edit.
 *
 * Binding a number directly gives the append-then-clamp and empty-snaps-back
 * bugs (see CLAUDE.md "Stepper inputs"), so the text is held locally, the
 * committed value follows as the user types, and the clamp happens on blur.
 */
function NumberField({
  id,
  label,
  value,
  min,
  max,
  suffix,
  disabled,
  error,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  disabled?: boolean;
  error?: string;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  // Follow outside changes (a preset button, a restored draft).
  useEffect(() => setText(String(value)), [value]);

  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5 ml-0.5"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          disabled={disabled}
          value={text}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value !== "") onCommit(Number(e.target.value));
          }}
          onBlur={() => {
            const n =
              text === ""
                ? min
                : Math.min(max, Math.max(min, Math.round(Number(text))));
            setText(String(n));
            onCommit(n);
          }}
          className={`w-28 bg-white border rounded-lg px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/10 focus:border-primary disabled:bg-zinc-50 disabled:text-zinc-400 ${
            error ? "border-red-400" : "border-zinc-200"
          }`}
        />
        {suffix && <span className="text-sm text-zinc-500">{suffix}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  enabled,
  locked,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  locked: boolean;
  onToggle: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm mb-4 mt-4 p-5 sm:p-6 md:p-7 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-zinc-800 text-base flex items-center gap-2">
            <Icon icon={icon} className="text-primary" />
            {title}
          </h3>
          <p className="text-zinc-500 mt-1 text-sm">{description}</p>
        </div>
        <CustomCheckbox
          checked={enabled}
          disabled={locked}
          onChange={onToggle}
          label="Enable"
        />
      </div>
      {enabled && (
        <div className="space-y-6 pt-4 border-t border-zinc-100">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PaymentOptionsEditor({
  instalment,
  inviteFriends,
  onInstalmentChange,
  onInviteFriendsChange,
  locked,
  agentCanConfigure,
  onAgentCanConfigureChange,
}: Props) {
  const inst = instalment ?? DEFAULT_INSTALMENT_CONFIG;
  const invite = inviteFriends ?? DEFAULT_INVITE_FRIENDS_CONFIG;
  const instErrors = validateInstalmentConfig(inst);
  const inviteErrors = validateInviteFriendsConfig(invite);

  const patchInst = (next: Partial<IInstalmentConfig>) =>
    onInstalmentChange({ ...inst, ...next });
  const patchInvite = (next: Partial<IInviteFriendsConfig>) =>
    onInviteFriendsChange({ ...invite, ...next });

  const example = splitInstalment(EXAMPLE_TOTAL_KOBO, inst.initial_percentage);
  const exampleShares = equalShares(
    EXAMPLE_TOTAL_KOBO,
    Math.max(invite.min_contributors, 1),
  );
  const money = (kobo: number) => formatMoney(koboToNaira(kobo));
  const presetActive = (p: number) => inst.initial_percentage === p;
  const isCustom = !INITIAL_PERCENT_PRESETS.some(presetActive);

  return (
    <section aria-labelledby="payment-options-heading" className="mt-10">
      <div className="mb-2">
        <h3
          id="payment-options-heading"
          className="text-xl font-bold text-zinc-800"
        >
          Payment options
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Let guests pay in instalments or split the cost with friends. A guest
          picks one option per booking; they can&apos;t be combined.
        </p>
      </div>

      {!FLEX_PAYMENTS_API_CONNECTED && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <Icon icon="solar:info-circle-bold" className="mt-0.5 shrink-0" />
          <span>
            Preview only: these settings are kept in this form but aren&apos;t
            saved with the listing until the payments service is connected.
          </span>
        </div>
      )}

      {locked && (
        <div className="mt-3 flex gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          <Icon icon="solar:lock-keyhole-bold" className="mt-0.5 shrink-0" />
          <span>
            The property owner hasn&apos;t authorised agents to change payment
            options. You can see the current settings but not edit them.
          </span>
        </div>
      )}

      {onAgentCanConfigureChange && (
        <div className="mt-3 rounded-xl border border-zinc-100 bg-white px-4 py-3">
          <CustomCheckbox
            checked={agentCanConfigure}
            onChange={onAgentCanConfigureChange}
            label="Let the assigned agent configure payment options"
          />
        </div>
      )}

      {/* Instalment Payment */}
      <SectionCard
        icon="solar:card-transfer-bold-duotone"
        title="Instalment payment"
        description="The guest pays part now and the balance later, by a deadline on or before check-in."
        enabled={!!instalment?.enabled}
        locked={locked}
        onToggle={(on) => onInstalmentChange({ ...inst, enabled: on })}
      >
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5 ml-0.5">
            Initial payment
          </span>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Initial payment percentage"
          >
            {INITIAL_PERCENT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={locked}
                aria-pressed={presetActive(p)}
                onClick={() => patchInst({ initial_percentage: p })}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors disabled:opacity-50 ${
                  presetActive(p)
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-primary/50"
                }`}
              >
                {p}%
              </button>
            ))}
            <span
              className={`text-sm ${isCustom ? "font-medium text-primary" : "text-zinc-400"}`}
            >
              {isCustom ? "Custom" : "or custom:"}
            </span>
            <NumberField
              id="instalment-initial"
              label=""
              value={inst.initial_percentage}
              min={INITIAL_PERCENT_MIN}
              max={INITIAL_PERCENT_MAX}
              suffix="%"
              disabled={locked}
              error={instErrors.initial_percentage}
              onCommit={(n) => patchInst({ initial_percentage: n })}
            />
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Outstanding balance:{" "}
            <strong className="text-zinc-800">
              {Math.max(
                0,
                100 -
                  (Number.isFinite(inst.initial_percentage)
                    ? inst.initial_percentage
                    : 0),
              )}
              %
            </strong>{" "}
            <span className="text-zinc-400">(calculated)</span>
          </p>
        </div>

        <NumberField
          id="instalment-deadline"
          label="Balance due (days before check-in)"
          value={inst.balance_deadline_days_before_checkin}
          min={0}
          max={MAX_DEADLINE_DAYS_BEFORE_CHECKIN}
          suffix={
            inst.balance_deadline_days_before_checkin === 0
              ? "days — at check-in"
              : "days before check-in"
          }
          disabled={locked}
          error={instErrors.balance_deadline_days_before_checkin}
          onCommit={(n) =>
            patchInst({ balance_deadline_days_before_checkin: n })
          }
        />

        {Object.keys(instErrors).length === 0 && (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-sm">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Example: a {money(EXAMPLE_TOTAL_KOBO)} booking
            </p>
            <div className="flex justify-between">
              <span className="text-zinc-600">
                Pay at checkout ({inst.initial_percentage}%)
              </span>
              <strong>{money(example.initialKobo)}</strong>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-zinc-600">
                Pay{" "}
                {inst.balance_deadline_days_before_checkin === 0
                  ? "by check-in"
                  : `by ${inst.balance_deadline_days_before_checkin} day${
                      inst.balance_deadline_days_before_checkin === 1 ? "" : "s"
                    } before check-in`}{" "}
                ({100 - inst.initial_percentage}%)
              </span>
              <strong>{money(example.balanceKobo)}</strong>
            </div>
          </div>
        )}
        <p className="text-xs text-zinc-400">
          Applies to new bookings only. Existing bookings keep the terms they
          were made under. Guests booking too close to check-in, when the
          deadline would already have passed, pay in full.
        </p>
      </SectionCard>

      {/* Invite Friends to Pay */}
      <SectionCard
        icon="solar:users-group-rounded-bold-duotone"
        title="Invite friends to pay"
        description="A guest invites others to each pay their own share of one booking through individual payment links."
        enabled={!!inviteFriends?.enabled}
        locked={locked}
        onToggle={(on) => onInviteFriendsChange({ ...invite, enabled: on })}
      >
        <div className="flex flex-wrap gap-6">
          <NumberField
            id="invite-min"
            label="Minimum contributors"
            value={invite.min_contributors}
            min={CONTRIBUTORS_MIN_ALLOWED}
            max={CONTRIBUTORS_MAX_ALLOWED}
            disabled={locked}
            error={inviteErrors.min_contributors}
            onCommit={(n) => patchInvite({ min_contributors: n })}
          />
          <NumberField
            id="invite-max"
            label="Maximum contributors"
            value={invite.max_contributors}
            min={CONTRIBUTORS_MIN_ALLOWED}
            max={CONTRIBUTORS_MAX_ALLOWED}
            disabled={locked}
            error={inviteErrors.max_contributors}
            onCommit={(n) => patchInvite({ max_contributors: n })}
          />
        </div>

        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2 ml-0.5">
            How guests can split the cost
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <CustomCheckbox
              checked={invite.allow_equal_split}
              disabled={locked}
              onChange={(v) => patchInvite({ allow_equal_split: v })}
              label="Equal shares"
            />
            <CustomCheckbox
              checked={invite.allow_custom_split}
              disabled={locked}
              onChange={(v) => patchInvite({ allow_custom_split: v })}
              label="Custom amounts"
            />
          </div>
          {inviteErrors.split && (
            <p className="mt-1 text-xs text-red-600">{inviteErrors.split}</p>
          )}
        </div>

        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-sm space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
            Funding window
          </p>
          <p className="text-zinc-700">
            Friends have <strong>{FUNDING_WINDOW_HOURS} hours</strong> to pay
            after the booking is started. The dates are held meanwhile; if the
            booking isn&apos;t fully funded in time it is released and everyone
            who paid is refunded.
          </p>
          {Object.keys(inviteErrors).length === 0 && (
            <p className="text-zinc-500 pt-1">
              Example: a {money(EXAMPLE_TOTAL_KOBO)} booking split between{" "}
              {invite.min_contributors} people is {money(exampleShares[0] ?? 0)}{" "}
              each.
            </p>
          )}
        </div>
      </SectionCard>
    </section>
  );
}
