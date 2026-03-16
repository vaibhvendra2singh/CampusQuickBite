

const HelpFAQ = () => {
 return (
 <div className="max-w-4xl mx-auto py-10 px-4 animate-none">
 <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-6">Help Center</h1>
 <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">
 Welcome to the CampusBite Help Center. Here you’ll find answers to common questions about ordering food, managing your account, and using the platform.
 </p>
 <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-xl p-5 mb-10 text-[var(--text-primary)]">
 If you cannot find the answer you need, please <a href="/contact" className="text-brand-500 font-semibold ">contact our support team</a>.
 </div>

 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Frequently Asked Questions</h2>

 <div className="space-y-8">
 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">How do I place an order?</h3>
 <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>Log in to your CampusBite account.</li>
 <li>Browse the list of available campus vendors.</li>
 <li>Select a vendor to view their menu.</li>
 <li>Add food items to your cart.</li>
 <li>Review your order and proceed to checkout.</li>
 <li>Confirm your order and complete payment if required.</li>
 </ol>
 <p className="mt-3 text-[var(--text-muted)]">Once your order is placed you will receive an order confirmation and order ID.</p>
 </div>

 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">How do I view my order history?</h3>
 <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>Log in to your account.</li>
 <li>Navigate to the Order History section.</li>
 <li>View previous orders and receipts.</li>
 </ol>
 </div>

 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">How do I cancel an order?</h3>
 <p className="mb-3 text-[var(--text-muted)]">Orders can only be canceled before the vendor begins preparing the food.</p>
 <p className="font-semibold text-[var(--text-primary)] mb-2 mt-4">Steps:</p>
 <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>Go to Order History</li>
 <li>Select the order</li>
 <li>Click Cancel Order if available</li>
 </ol>
 </div>

 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">What payment methods are accepted?</h3>
 <p className="mb-2 text-[var(--text-muted)]">CampusBite may support:</p>
 <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] ml-2">
 <li>Online payment gateways</li>
 <li>Campus payment systems</li>
 <li>Cash on pickup if enabled by vendor</li>
 </ul>
 </div>

 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">What should I do if my order is incorrect?</h3>
 <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>Check your receipt in Order History</li>
 <li>Contact the vendor</li>
 <li>If unresolved contact CampusBite Support with your Order ID</li>
 </ol>
 </div>

 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">How do vendors manage their menus?</h3>
 <p className="mb-2 text-[var(--text-muted)]">Vendors use the Vendor Dashboard to:</p>
 <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] ml-2">
 <li>add items</li>
 <li>edit prices</li>
 <li>remove items</li>
 <li>view incoming orders</li>
 <li>update order status</li>
 </ul>
 </div>

 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Why can’t I see a vendor or menu item?</h3>
 <p className="text-[var(--text-muted)]">Some vendors may temporarily disable their menu when they are closed or not accepting orders.</p>
 </div>
 </div>
 </div>
 );
};

export default HelpFAQ;
