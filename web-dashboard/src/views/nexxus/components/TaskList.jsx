import { useState } from "react";
import { MdCheckCircle, MdDragIndicator } from "react-icons/md";
import Checkbox from "components/checkbox";
import NexxusCard from "./NexxusCard";

const TaskList = ({ title = "Tasks", tasks, readOnly = false, delay = 0 }) => {
  const [done, setDone] = useState(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.done]))
  );

  return (
    <NexxusCard extra="pb-7 p-[20px]" delay={delay}>
      <div className="relative flex flex-row justify-between">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-charcoal-light">
            <MdCheckCircle className="h-6 w-6 text-brand-500 dark:text-white" />
          </div>
          <h4 className="ml-4 text-xl font-bold text-navy-700 dark:text-white">
            {title}
          </h4>
        </div>
      </div>

      <div className="h-full w-full">
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className="animate-fade-in-up mt-2 flex items-center justify-between rounded-lg p-2 transition-colors duration-250 hover:bg-gray-50 dark:hover:bg-charcoal-light"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-center gap-2">
              <Checkbox
                checked={done[task.id]}
                disabled={readOnly}
                onChange={() =>
                  setDone((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                }
              />
              <p
                className={`text-base font-bold text-navy-700 dark:text-white ${
                  done[task.id] ? "line-through opacity-50" : ""
                }`}
              >
                {task.title}
              </p>
            </div>
            {!readOnly && (
              <MdDragIndicator className="h-6 w-6 text-navy-700 dark:text-white" />
            )}
          </div>
        ))}
      </div>
    </NexxusCard>
  );
};

export default TaskList;
