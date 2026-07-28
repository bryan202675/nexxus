// Charcoal-dark-mode counterpart to components/card — same shape, but dark mode uses
// #2A2A2A / white / a barely-visible border instead of the Horizon navy palette.
const NexxusCard = (props) => {
  const { extra = "", delay = 0, children, ...rest } = props;
  return (
    <div
      className={`animate-fade-in-up relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 transition-all duration-250 dark:!border dark:!border-charcoal-border dark:!bg-charcoal dark:text-white dark:shadow-none ${extra}`}
      style={{ animationDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default NexxusCard;
