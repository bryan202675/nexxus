import { iconPaths, IconName } from '../config/icons';

export default function Icon({ name, className = 'nxn-icon' }: { name: IconName; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[name].map((path, index) => (
        <path d={path} key={index} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} />
      ))}
    </svg>
  );
}
