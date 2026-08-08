const Footer = () => {
  return (
    <div className="flex w-full flex-col items-center justify-center px-1 pb-8 pt-3 lg:px-8">
      <p className="text-center text-sm text-gray-600 dark:text-white/60">
        © {new Date().getFullYear()} Nexxus. Panel de trabajo.
      </p>
    </div>
  );
};

export default Footer;
