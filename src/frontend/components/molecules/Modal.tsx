"use client";

import { Dialog, Transition } from "@headlessui/react";
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
}: Props) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl border border-neonBlue/40 bg-night p-6 text-left align-middle shadow-glow transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-neonBlue">{title}</Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-sm text-neonPink/80">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <button onClick={onClose} className="text-neonBlue hover:text-neonPink">
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
