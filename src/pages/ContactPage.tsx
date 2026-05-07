import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactPage: React.FC = () => {
  return (
    <div className="pt-24 pb-32 bg-[#0A0A0B] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div>
            <h1 className="text-6xl font-bold tracking-tighter mb-8 leading-none">Get in <br /> <span className="text-brand-gold italic">Touch</span></h1>
            <p className="text-xl text-white/60 font-light mb-16 leading-relaxed">
              Have a question about an order or just want to say hello? Our team is always here to help you.
            </p>

            <div className="space-y-12">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-center text-brand-gold">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Email Us</h4>
                  <p className="text-lg font-medium text-white">merro4h@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-center text-brand-gold">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Call Us</h4>
                  <p className="text-lg font-medium text-white">+1 (234) 567-890</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-center text-brand-gold">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">Visit Studio</h4>
                  <p className="text-lg font-medium text-white">88 Design Avenue, London</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-10 rounded-[3rem] shadow-xl border border-white/10">
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/50">First Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/50">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/50">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/50">Message</label>
                <textarea 
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all resize-none"
                />
              </div>
              <button className="w-full bg-brand-gold text-[#0A0A0B] font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-lg hover:shadow-xl">
                Send Message <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
