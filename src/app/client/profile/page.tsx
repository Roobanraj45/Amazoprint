import { getUserProfile, getUserStats } from "@/app/actions/user-actions";
import { getBankDetails } from "@/app/actions/bank-actions";
import { BankDetailsForm } from "@/components/BankDetailsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Trophy, Package, ShieldCheck, Mail, CalendarDays, Phone } from "lucide-react";

export default async function ClientProfilePage() {
    const profile = await getUserProfile();
    const stats: any = await getUserStats();
    const bankData = await getBankDetails();

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Client Dashboard</Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Profile</h1>
                    <p className="text-muted-foreground font-medium">Manage your personal information and view your activity metrics.</p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Details Card */}
                <Card className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-sky-500/20 to-blue-600/20" />
                    <CardHeader className="pt-12 pb-2 relative z-10 text-center">
                        <Avatar className="h-24 w-24 border-4 border-background mx-auto mb-4 shadow-xl">
                            <AvatarImage src={profile.profileImage || ""} />
                            <AvatarFallback className="bg-sky-100 text-sky-700 text-3xl font-black uppercase">
                                {profile.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl font-black tracking-tight">{profile.name}</CardTitle>
                        <CardDescription className="font-medium">Client Account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Email Address</p>
                                    <p className="font-medium text-foreground">{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Phone Number</p>
                                    <p className="font-medium text-foreground">{profile.phone || "Not provided"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                    <CalendarDays className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Member Since</p>
                                    <p className="font-medium text-foreground">{profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'Unknown'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Metrics Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black tracking-tight">Activity Metrics</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-primary/30 transition-colors">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-black">{stats.contestsCreated || 0}</p>
                                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-1">Contests Created</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-primary/30 transition-colors">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-black">{stats.ordersPlaced || 0}</p>
                                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-1">Orders Placed</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-primary/30 transition-colors sm:col-span-2 md:col-span-1">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-black">{stats.verificationsRequested || 0}</p>
                                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-1">Verifications Requested</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="pt-2">
                        <BankDetailsForm initialData={bankData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
