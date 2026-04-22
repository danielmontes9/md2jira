import { Modal } from './Modal.js'
import { IconInfoCircle, IconCloseOcticon, IconExternalLink } from './icons.js'

interface InfoModalProps {
  onClose: () => void
}

export function InfoModal({ onClose }: InfoModalProps) {
  return (
    <Modal onClose={onClose} ariaLabelledBy="info-modal-title">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="Close"
        >
          <IconCloseOcticon className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
            <IconInfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2
              id="info-modal-title"
              className="text-base font-bold text-neutral-900 dark:text-neutral-100"
            >
              md2jira
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Open-source Markdown → Jira converter
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mb-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          md2jira converts Markdown documents into <strong>Jira Wiki Markup</strong> and{' '}
          <strong>Atlassian Document Format (ADF)</strong>. Paste your Markdown on the left, get
          Jira-ready content on the right — copy and paste directly into any Jira Cloud issue,
          comment, or description.
        </p>

        {/* Packages */}
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Packages
          </p>
          {[
            {
              name: 'md2jira-core',
              description:
                'Pure TypeScript conversion engine. Zero browser dependencies — works in Node.js, browsers, and VSCode extensions.',
              href: 'https://github.com/danielmontes9/md2jira/tree/main/packages/core',
              badge: 'core',
            },
            {
              name: 'md2jira-cli',
              description: 'Command-line tool to convert Markdown files from your terminal.',
              href: 'https://github.com/danielmontes9/md2jira/tree/main/packages/cli',
              badge: 'cli',
            },
            {
              name: 'md2jira-previewer',
              description: 'This web app — live two-panel converter built with React 18 + Vite.',
              href: 'https://github.com/danielmontes9/md2jira/tree/main/apps/web',
              badge: 'web',
            },
          ].map(({ name, description, href, badge }) => (
            <a
              key={badge}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-neutral-800 dark:hover:border-blue-800 dark:hover:bg-blue-950"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {badge}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
              </div>
              <IconExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">MIT License</span>
          <a
            href="https://github.com/danielmontes9/md2jira"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </Modal>
  )
}
