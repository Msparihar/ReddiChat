import { cn } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";

// BentoItem shape:
// {
//   title: string,
//   description: string,
//   icon: React.ReactNode,
//   status?: string,
//   tags?: string[],
//   meta?: string,
//   cta?: string,
//   colSpan?: number,
//   hasPersistentHover?: boolean
// }

function BentoGrid({ items }) {
    const { isDark } = useTheme();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-7xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        "group relative p-4 rounded-xl overflow-hidden transition-all duration-300",
                        isDark
                            ? "border border-white/10 bg-slate-900/50"
                            : "border border-gray-100/80 bg-white/80 backdrop-blur-sm",
                        "hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_2px_12px_rgba(255,255,255,0.03)]",
                        "hover:-translate-y-0.5 will-change-transform",
                        item.colSpan || "col-span-1",
                        item.colSpan === 2 ? "md:col-span-2" : "",
                        {
                            "shadow-[0_2px_12px_rgba(0,0,0,0.03)] -translate-y-0.5":
                                item.hasPersistentHover,
                            "dark:shadow-[0_2px_12px_rgba(255,255,255,0.03)]":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    <div
                        className={`absolute inset-0 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    >
                        <div className={cn(
                            "absolute inset-0 bg-[length:4px_4px]",
                            isDark
                                ? "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)]"
                                : "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)]"
                        )} />
                    </div>

                    <div className="relative flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-br transition-all duration-300",
                                isDark ? "bg-white/10" : "bg-black/5"
                            )}>
                                {item.icon}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm",
                                    "transition-colors duration-300",
                                    isDark
                                        ? "bg-white/10 text-gray-300 group-hover:bg-white/20"
                                        : "bg-black/5 text-gray-600 group-hover:bg-black/10"
                                )}
                            >
                                {item.status || "Active"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className={cn(
                                "font-medium tracking-tight text-[15px]",
                                isDark ? "text-gray-100" : "text-gray-900"
                            )}>
                                {item.title}
                                {item.meta && (
                                    <span className={cn(
                                        "ml-2 text-xs font-normal",
                                        isDark ? "text-gray-400" : "text-gray-500"
                                    )}>
                                        {item.meta}
                                    </span>
                                )}
                            </h3>
                            <p className={cn(
                                "text-sm leading-snug font-[425]",
                                isDark ? "text-gray-300" : "text-gray-600"
                            )}>
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className={cn(
                                "flex items-center space-x-2 text-xs",
                                isDark ? "text-gray-400" : "text-gray-500"
                            )}>
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            "px-2 py-1 rounded-md backdrop-blur-sm transition-all duration-200",
                                            isDark
                                                ? "bg-white/10 hover:bg-white/20"
                                                : "bg-black/5 hover:bg-black/10"
                                        )}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <span className={cn(
                                "text-xs opacity-0 group-hover:opacity-100 transition-opacity",
                                isDark ? "text-gray-400" : "text-gray-500"
                            )}>
                                {item.cta || "Explore →"}
                            </span>
                        </div>
                    </div>

                    <div
                        className={cn(
                            `absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent to-transparent`,
                            isDark ? "via-white/10" : "via-gray-100/50",
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100",
                            "transition-opacity duration-300"
                        )}
                    />
                </div>
            ))}
        </div>
    );
}

export { BentoGrid };
