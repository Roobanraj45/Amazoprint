import { getUserProfile, getUserStats } from "@/app/actions/user-actions";
import { getBankDetails } from "@/app/actions/bank-actions";
import { BankDetailsForm } from "@/components/BankDetailsForm";
import { ProfileEditForm } from "@/components/freelancer/profile-edit-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Trophy, ShieldCheck, Mail, CalendarDays, Phone, Briefcase, Code, Sparkles, Clock, ExternalLink, User, CreditCard, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default async function FreelancerProfilePage() {
    const profile = await getUserProfile();
    const stats: any = await getUserStats();
    const bankData = await getBankDetails();

    // Format hourly rate
    const hourlyRateFormatted = profile.hourlyRate 
        ? parseFloat(profile.hourlyRate).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) 
        : null;

    // Get availability status styles
    const getAvailabilityBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-extrabold uppercase text-[10px] tracking-wider">Available for work</Badge>;
            case 'busy':
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-extrabold uppercase text-[10px] tracking-wider">Busy</Badge>;
            default:
                return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 font-extrabold uppercase text-[10px] tracking-wider">Offline</Badge>;
        }
    };

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Freelancer Space</Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Profile</h1>
                    <p className="text-muted-foreground font-medium">Manage your designer information, skills, stats, and payouts account details.</p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Bank account details displayed in summary card with Edit Popup Modal */}
                <div className="lg:col-span-1">
                    <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-violet-500" /> Bank Payout Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {bankData ? (
                                <div className="space-y-4">
                                    <div className="space-y-2.5 bg-muted/40 p-4 rounded-2xl border border-border/50 shadow-inner">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Bank Name</p>
                                            <p className="font-bold text-sm text-foreground flex items-center gap-1.5 mt-0.5">
                                                <Building2 className="w-4 h-4 text-slate-500" /> {bankData.bankName}
                                            </p>
                                        </div>
                                        
                                        <hr className="border-t border-border/40 my-2" />
                                        
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Account Holder</p>
                                            <p className="font-bold text-xs text-foreground mt-0.5">{bankData.accountHolderName}</p>
                                        </div>
                                        
                                        <hr className="border-t border-border/40 my-2" />
                                        
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Account Number</p>
                                            <p className="font-mono text-xs text-foreground mt-0.5">
                                                •••• •••• {bankData.accountNumber.slice(-4)}
                                            </p>
                                        </div>
                                        
                                        <hr className="border-t border-border/40 my-2" />
                                        
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">IFSC Code</p>
                                            <p className="font-mono text-xs text-foreground uppercase mt-0.5">{bankData.ifscCode}</p>
                                        </div>

                                        <hr className="border-t border-border/40 my-2" />

                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Payout Status</p>
                                            <div className="mt-1">
                                                {bankData.isVerified ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                                                        <ShieldCheck className="w-3 h-3" /> Verified Account
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                        Verification Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-10 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                                                Edit Payout Details
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl rounded-3xl bg-card border-border/50 p-0 overflow-hidden shadow-2xl">
                                            <BankDetailsForm initialData={bankData} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ) : (
                                <div className="space-y-4 text-center py-6">
                                    <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-foreground">No Bank Account Added</p>
                                        <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed font-semibold">
                                            Add your payout details to enable automated prize transfers.
                                        </p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-700 text-white h-9 px-4 mt-2">
                                                Add Payout Account
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl rounded-3xl bg-card border-border/50 p-0 overflow-hidden shadow-2xl">
                                            <BankDetailsForm initialData={null} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Bio, Skills, Stats & Profile Details (now inline Edit Form) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Metrics */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black tracking-tight">Performance Metrics</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-violet-500/30 transition-colors">
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black">{stats.contestsJoined || 0}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1.5">Contests Joined</p>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-violet-500/30 transition-colors">
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black">{stats.contestsWon || 0}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1.5">Contests Won</p>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-violet-500/30 transition-colors">
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black">{stats.verificationsCompleted || 0}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1.5">Designs Verified</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Inline Profile Editing Form */}
                    <ProfileEditForm initialData={profile} />
                </div>
            </div>
        </div>
    );
}
