function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-orange-500">
          FoodRush
        </h2>

        <p className="text-gray-400 mt-3">
          Delicious food delivered
          to your doorstep, fast
          and fresh.
        </p>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500 text-sm">
          ©{" "}
          {new Date().getFullYear()}{" "}
          FoodRush. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;