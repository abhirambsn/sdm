const Topbar = () => {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Sentinel Directory Manager Admin Console
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-500">
          Status: <span className="ml-2 text-green-500">Online</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
