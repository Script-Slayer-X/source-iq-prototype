import { GlassPanel } from "@/components/common/GlassPanel";

export function WorkspacePeek() {
  return (
    <section className="relative mx-auto -mt-6 max-w-6xl px-6 pb-24">
      <div className="relative rounded-[24px] bg-gradient-to-b from-white/10 to-transparent p-1 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)]">
        <GlassPanel className="flex h-[560px] flex-col overflow-hidden md:h-[680px] md:flex-row">
          {/* Sidebar */}
          <aside className="flex w-full flex-col gap-8 border-b border-border p-5 md:w-64 md:border-b-0 md:border-r">
            <div className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Projects
              </div>
              <div className="space-y-1">
                <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm">
                  Neural Ethics
                </div>
                <div className="rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  Quantum Computing
                </div>
                <div className="rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  Social Dynamics
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Study Sets
              </div>
              <div className="flex items-center gap-3 px-3 py-1 text-sm text-muted-foreground">
                <span aria-hidden className="size-2 rounded-full bg-accent" />
                Reading List v2
              </div>
            </div>
          </aside>

          {/* Main */}
          <section className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="mx-auto max-w-2xl">
                <h3 className="font-display text-2xl italic md:text-3xl">
                  Synthesis of Ethics in Neural Systems
                </h3>
                <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <p>
                    Artificial intelligence models are increasingly deployed in
                    high-stakes environments. The concern regarding{" "}
                    <span className="border-b border-accent bg-accent/20 text-foreground">
                      algorithmic transparency
                    </span>{" "}
                    remains central to the discourse.
                  </p>
                  <div className="my-6 rounded-xl border border-accent/10 bg-accent/5 p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                      Study Generator
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      Synthesizing flashcards for "Neural Accountability
                      Protocols"...
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="h-12 rounded-md border border-white/5 bg-background/50" />
                      <div className="h-12 rounded-md border border-white/5 bg-background/50" />
                    </div>
                  </div>
                  <p>
                    Data used in training often reflects historical biases that
                    can be amplified during inference phases.
                  </p>
                </div>
              </div>
            </div>

            <aside className="flex w-full flex-col gap-6 border-t border-border bg-black/20 p-6 lg:w-80 lg:border-l lg:border-t-0">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Trust Score</div>
                <div className="mt-1 font-display text-5xl italic text-accent">
                  98%
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex justify-between text-xs font-semibold">
                    <span>Primary Citation</span>
                    <span className="text-accent">Verified</span>
                  </div>
                  <div className="text-[11px] leading-tight text-muted-foreground">
                    Nature Machine Intelligence (2023) · DOI: 10.1038/s42256
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 opacity-70">
                  <div className="mb-2 text-xs font-semibold">
                    Cross Reference
                  </div>
                  <div className="text-[11px] leading-tight text-muted-foreground">
                    Stanford Ethics Lab Proceedings, Page 412
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </GlassPanel>
      </div>
    </section>
  );
}
