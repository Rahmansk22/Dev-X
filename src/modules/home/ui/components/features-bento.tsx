import { Card, CardContent } from '@/components/ui/card';
import { BrainCircuit, DollarSign, Rocket, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a `cn` utility for classnames
import { SiAnthropic, SiOpenai } from 'react-icons/si';
import { FaGoogle } from 'react-icons/fa6';

// Add this CSS to your global stylesheet (e.g., globals.css)
/*
@keyframes type-out {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: hsl(var(--primary));
  }
}

.type-out-text {
  overflow: hidden;
  white-space: nowrap;
  animation: type-out 1s steps(20, end) forwards;
}

.blinking-caret {
  border-right: 0.15em solid hsl(var(--primary));
  animation: blink-caret 0.75s step-end infinite;
}
*/


export function Features() {
  return (
    <section className="py-16 md:py-24 dark:bg-transparent">
      <style>
        {`
          @keyframes type-out {
            from { width: 0; }
            to { width: 100%; }
          }
          @keyframes blink-caret {
            from, to { border-color: transparent; }
            50% { border-color: hsl(var(--primary)); }
          }
          .type-out-text {
            overflow: hidden;
            white-space: nowrap;
            animation: type-out 1s steps(20, end) forwards;
          }
          .blinking-caret {
            border-right: .15em solid hsl(var(--primary));
            animation: blink-caret .75s step-end infinite;
          }
        `}
      </style>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Invent, Remix, and Launch—All in One Place</h2>
          <p className="mt-4 text-lg text-muted-foreground">Dev X gives you the freedom to build web projects that are truly yours. No templates. No limits. Just pure creativity, unleashed.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
          {/* Feature 1: Built in 10 Days - Revised */}
          <Card className="group relative col-span-full overflow-hidden rounded-xl border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div className="flex h-full min-h-37.5 flex-col justify-between">
                <div className="flex w-full items-end justify-center gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 w-full origin-bottom rounded-t-sm bg-primary/10 transition-transform duration-300 ease-out group-hover:scale-y-100"
                      style={{
                        transform: `scaleY(${0.1 + (i * 0.09)})`,
                        transitionDelay: `${i * 50}ms`,
                      }}
                    >
                      <div
                        className="h-full w-full origin-bottom bg-primary/80 transition-transform duration-300 ease-out group-hover:scale-y-0"
                        style={{
                          transitionDelay: `${i * 50}ms`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-baseline justify-center gap-2">
                  <p className="text-4xl font-bold text-primary">10</p>
                  <p className="font-medium text-muted-foreground">Days of Rapid Progress</p>
                </div>
              </div>
              <div className="relative z-10 mt-6">
                <h3 className="text-lg font-semibold text-foreground">Built by 1 Dropout in 10 Days</h3>
                <p className="mt-2 text-sm text-muted-foreground">Showcasing the power of rapid development from a simple idea to a fully functional product.</p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 2: Unlimited & Secure - Revised */}
          <Card className="group relative col-span-full overflow-hidden rounded-xl border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div className="relative flex h-full min-h-37.5 w-full items-center justify-center">
                  <div className="absolute h-24 w-28 rounded-md border-2 border-border bg-card shadow-sm transition-all duration-500 ease-in-out group-hover:-translate-x-4 group-hover:-translate-y-3 group-hover:-rotate-12"></div>
                  <div className="absolute h-24 w-28 rounded-md border-2 border-border bg-card shadow-sm transition-all duration-500 ease-in-out group-hover:translate-x-4 group-hover:-translate-y-3 group-hover:rotate-12"></div>
                  <div className="relative z-10 flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-md border-2 border-primary/50 bg-card shadow-xl">
                      <div className="relative size-8 text-primary">
                          <ShieldCheck className="size-full" strokeWidth={1.5} />
                          <div className="absolute left-1/2 top-1/2 h-10 w-0.5 -translate-x-1/2 -translate-y-1/2 origin-center animate-[spin_2s_linear_infinite] bg-linear-to-t from-transparent to-primary group-hover:animate-none"></div>
                      </div>
                      <p className="text-xs font-bold text-foreground">Unlimited Projects</p>
                  </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground">Unlimited & Secure Projects</h3>
                <p className="mt-2 text-sm text-muted-foreground">Create as many projects as you need. All your data is private and protected.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Feature 3: Affordable Pricing - Revised */}
          <Card className="group relative col-span-full overflow-hidden rounded-xl border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div className="flex h-full min-h-37.5 w-full items-end justify-around gap-4">
                  <div className="flex flex-col items-center gap-2">
                      <div className="relative flex size-12 items-center justify-center rounded-full border-2 border-dashed border-primary/50 transition-transform duration-500 group-hover:transform-[rotateY(180deg)]">
                          <DollarSign className="size-6 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">$9 Cost</p>
                  </div>
                   <div className="flex h-full flex-col items-center gap-2">
                      <div className="flex h-full w-12 items-end">
                          <div className="h-2/3 w-full origin-bottom rounded-t-md bg-primary/80 transition-transform duration-500 ease-out group-hover:scale-y-100"></div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">10x ROI</p>
                  </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground">Affordable Pricing, Better ROI</h3>
                <p className="mt-2 text-sm text-muted-foreground">Our pricing is designed to provide a massive return on your investment.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Removed AI tool icons and 'Powered by' section */}
          {/* Ensure no 'Powered by' label remains */}

          {/* Feature 5: One-Click Deployment - Unchanged */}
          {/* Removed E2B, Vercel, Netlify, and Dev X references */}
        </div>
      </div>
    </section>
  );
}
