"use client";

import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/atoms/Button";

type Props = {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isPrimaryDisabled?: boolean;
  inert?: boolean;
};

export function Modal({
  title,
  description,
  isOpen,
  onClose,
  children,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  isPrimaryDisabled,
  inert = false,
}: Props) {
  const overlayClasses = clsx("fixed inset-0 z-40 bg-black/70", inert && "pointer-events-none");
  const containerClasses = clsx("fixed inset-0 z-50 overflow-y-auto", inert && "pointer-events-none");
  const panelClasses = clsx(
    "relative z-50 w-full max-w-2xl transform overflow-hidden rounded-2xl border border-neonBlue/40 bg-night p-6 text-left align-middle shadow-glow transition-all",
    inert && "pointer-events-none",
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={inert ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className={overlayClasses} />
        </Transition.Child>

        <div className={containerClasses}>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={panelClasses} aria-hidden={inert}>
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-neonBlue">{title}</Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-sm text-neonPink/80">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <button type="button" onClick={onClose} className="text-neonBlue hover:text-neonPink">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 space-y-4 text-base text-neonPink">{children}</div>

                {(primaryActionLabel || secondaryActionLabel) && (
                  <div className="mt-8 flex flex-col items-end justify-end gap-3 sm:flex-row">
                    {secondaryActionLabel ? (
                      <Button variant="ghost" onClick={onSecondaryAction}>
                        {secondaryActionLabel}
                      </Button>
                    ) : null}
                    {primaryActionLabel ? (
                      <Button onClick={onPrimaryAction} disabled={isPrimaryDisabled}>
                        {primaryActionLabel}
                      </Button>
                    ) : null}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
