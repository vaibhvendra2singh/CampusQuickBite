

const ContactUs = () => {
 return (
 <div className="max-w-4xl mx-auto py-10 px-4 animate-none">
 <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-6">Contact Us</h1>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">Get in Touch</h2>
 <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">
 If you have questions, technical issues, or feedback about CampusBite, our support team is here to help.
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-2xl shadow-sm">
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 text-brand-500 uppercase tracking-wide text-sm">Support Email</h3>
 <p className="text-[var(--text-primary)] font-medium text-lg mb-6"><a href="mailto:support@campusbite.com" className=" transition-colors">support@campusbite.com</a></p>

 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 text-brand-500 uppercase tracking-wide text-sm">General Inquiries</h3>
 <p className="text-[var(--text-primary)] font-medium text-lg"><a href="mailto:info@campusbite.com" className=" transition-colors">info@campusbite.com</a></p>
 </div>

 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-2xl shadow-sm">
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 text-brand-500 uppercase tracking-wide text-sm">Campus Location</h3>
 <address className="text-[var(--text-muted)] not-italic space-y-1 mb-6">
 <p className="font-medium text-[var(--text-primary)]">CampusBite Support</p>
 <p>Campus Food Services Office</p>
 <p>[Your University / Campus Name]</p>
 <p>[Campus Address Placeholder]</p>
 </address>

 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 text-brand-500 uppercase tracking-wide text-sm">Support Hours</h3>
 <p className="text-[var(--text-muted)]">Monday – Friday</p>
 <p className="text-[var(--text-primary)] font-medium">9:00 AM – 6:00 PM</p>
 </div>
 </div>
 </div>
 );
};

export default ContactUs;
