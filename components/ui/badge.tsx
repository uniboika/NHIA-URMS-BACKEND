import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1",
    "overflow-hidden rounded-full border px-2 py-0.5",
    "text-[11px] font-semibold whitespace-nowrap",
    "transition-all duration-150",
    "focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ],
  {
    variants: {
      variant: {
        default:     "bg-[#145c3f] border-[#0f3d2e]/20 text-white",
        secondary:   "bg-[#e8f5ee] border-[#c8e6d8] text-[#145c3f]",
        destructive: "bg-rose-50 border-rose-200 text-rose-700",
        outline:     "bg-transparent border-[#b8ddc8] text-[#145c3f]",
        ghost:       "bg-transparent border-transparent text-slate-500 hover:bg-[#e8f5ee] hover:text-[#145c3f]",
        link:        "bg-transparent border-transparent text-[#145c3f] underline-offset-4 hover:underline",
        // status helpers used across the app
        warning:     "bg-amber-50 border-amber-200 text-amber-700",
        info:        "bg-blue-50 border-blue-200 text-blue-700",
        purple:      "bg-purple-50 border-purple-200 text-purple-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
