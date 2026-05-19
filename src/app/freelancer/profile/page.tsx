import { getUserProfile, getUserStats } from "@/app/actions/user-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Trophy, ShieldCheck, Mail, CalendarDays, Phone, Briefcase, Code, Sparkles, Clock, ExternalLink } from "lucide-react";

export default async function FreelancerProfilePage() {
    const profile = await getUserProfile();
    const stats: any = await getUserStats();

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
                    <p className="text-muted-foreground font-medium">Showcase your skills, track your wins, and manage your availability.</p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <Card className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20" />
                    <CardHeader className="pt-12 pb-2 relative z-10 text-center">
                        <Avatar className="h-24 w-24 border-4 border-background mx-auto mb-4 shadow-xl">
                            <AvatarImage src={profile.profileImage || ""} />
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-3xl font-black uppercase">
                                {profile.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl font-black tracking-tight">{profile.name}</CardTitle>
                        <CardDescription className="font-bold text-violet-600 dark:text-violet-400">Professional Designer</CardDescription>
                        <div className="mt-2.5 flex justify-center">
                            {getAvailabilityBadge(profile.availabilityStatus || 'available')}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 pt-6 relative z-10 border-t border-border/40">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Email Address</p>
                                    <p className="font-semibold text-foreground truncate">{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Phone Number</p>
                                    <p className="font-semibold text-foreground">{profile.phone || "Not provided"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                    <CalendarDays className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Member Since</p>
                                    <p className="font-semibold text-foreground">{profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'Unknown'}</p>
                                </div>
                            </div>
                            
                            {hourlyRateFormatted && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Hourly Rate</p>
                                        <p className="font-semibold text-foreground">{hourlyRateFormatted}/hr</p>
                                    </div>
                                </div>
                            )}

                            {profile.experienceYears !== null && profile.experienceYears !== undefined && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Experience</p>
                                        <p className="font-semibold text-foreground">{profile.experienceYears} Years</p>
                                    </div>
                                </div>
                            )}

                            {profile.portfolioUrl && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <ExternalLink className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Portfolio</p>
                                        <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 flex items-center gap-1 hover:underline">
                                            Visit Portfolio <ExternalLink className="w-3 h-3 inline" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Side: Bio, Skills & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bio Section */}
                    <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
                        <CardHeader>
                            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-violet-500" /> About Me
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                {profile.bio || "No professional bio provided. Introduce yourself to clients by updating your designer profile information."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Skills Section */}
                    {profile.skills && profile.skills.length > 0 && (
                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
                            <CardHeader>
                                <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <Code className="w-5 h-5 text-violet-500" /> Skillsets & Expertise
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {profile.skills.map((skill: string) => (
                                    <Badge key={skill} variant="secondary" className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-violet-600/5 text-violet-600 dark:bg-violet-400/5 dark:text-violet-400 border border-violet-600/10">
                                        {skill}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Statistics Cards */}
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
                </div>
            </div>
        </div>
    );
}
