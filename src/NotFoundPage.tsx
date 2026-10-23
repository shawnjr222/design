export function NotFoundPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section className="page-pad-x pt-40 pb-24">
      <div className="mx-auto max-w-[720px]">
        <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.04em]">
          Page not found
        </h1>
        <p className="mt-5 text-[16px] text-[var(--ink-soft)]">
          That page doesn’t exist.{' '}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              onNavigate('/')
            }}
            className="underline underline-offset-4"
          >
            Go to the home page
          </a>
          .
        </p>
      </div>
    </section>
  )
}
