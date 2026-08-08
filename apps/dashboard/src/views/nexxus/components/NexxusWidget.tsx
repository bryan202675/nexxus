import NexxusCard from "./NexxusCard";

const NexxusWidget = ({ icon: Icon, title, subtitle, delay = 0 }) => {
  return (
    <NexxusCard
      extra="!flex-row flex-grow items-center rounded-[20px] transition-transform duration-250 hover:-translate-y-1 hover:shadow-lg"
      delay={delay}
    >
      <div className="ml-[18px] flex h-[90px] w-auto flex-row items-center">
        <div className="rounded-full bg-lightPrimary p-3 dark:bg-charcoal-light">
          <span className="flex items-center text-brand-500 dark:text-white">
            <Icon className="h-7 w-7" />
          </span>
        </div>
      </div>

      <div className="h-50 ml-4 flex w-auto flex-col justify-center">
        <p className="font-dm text-sm font-medium text-gray-600 dark:text-white/70">
          {title}
        </p>
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {subtitle}
        </h4>
      </div>
    </NexxusCard>
  );
};

export default NexxusWidget;
