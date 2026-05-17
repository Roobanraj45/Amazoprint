'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { getUsers, updateUserStatus } from '@/app/actions/user-actions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Loader2, Search, Filter, X, ShieldCheck, UserCheck, UserX, Calendar, Mail, Sparkles, Users, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type User = Awaited<ReturnType<typeof getUsers>>[0];

function UserStatusToggle({ user, onStatusChange }: { user: User; onStatusChange?: (userId: string, isActive: boolean) => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (isActive: boolean) => {
        startTransition(async () => {
            try {
                await updateUserStatus({ userId: user.id, isActive });
                if (onStatusChange) {
                    onStatusChange(user.id, isActive);
                }
                toast({
                    title: 'Status Updated successfully',
                    description: `User ${user.name || user.email} has been ${isActive ? 'activated' : 'deactivated'}.`,
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error updating status',
                    description: error.message,
                });
            }
        });
    };

    return (
        <div className="flex items-center gap-2.5">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {isPending ? 'Updating...' : user.isActive ? 'Active' : 'Inactive'}
            </span>
            <Switch
                checked={user.isActive ?? false}
                onCheckedChange={handleToggle}
                disabled={isPending}
                aria-label={`Toggle status for ${user.name}`}
                className="data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500 shadow-sm"
            />
        </div>
    );
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Filtering & Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load users',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleLocalStatusUpdate = (userId: string, isActive: boolean) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, isActive } : u));
    };

    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setStatusFilter('all');
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery ? true : (
            (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
            (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
        const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? user.isActive : !user.isActive;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const totalUsersCount = users.length;
    const activeUsersCount = users.filter(u => u.isActive).length;
    const adminUsersCount = users.filter(u => u.role === 'admin').length;

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Stunning Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-2xl border border-slate-800">
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
                <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline-block animate-pulse" />
                                Identity & Access Engine
                            </Badge>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">User Management & Permissions</h1>
                        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                            Search, filter, inspect, and manage system access permissions, assigned roles, and authentication lifecycles for all administrative, printer, and client accounts.
                        </p>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="grid grid-cols-3 gap-4 w-full lg:w-auto flex-shrink-0">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner">
                            <p className="text-2xl sm:text-3xl font-extrabold text-white">{isLoading ? '-' : totalUsersCount}</p>
                            <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider mt-1">Total Users</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner">
                            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{isLoading ? '-' : activeUsersCount}</p>
                            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider mt-1">Active Accounts</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-inner">
                            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-300">{isLoading ? '-' : adminUsersCount}</p>
                            <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider mt-1">Administrators</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Search & Filtering Matrix */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Search & Filter Matrix</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-3 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-destructive font-bold text-xs transition-colors">
                                <X className="w-4 h-4 mr-1.5" /> Clear Filters
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading} className="h-9 px-3.5 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Directory
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                    {/* Search Input */}
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input
                            placeholder="Search accounts by full name or email address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-semibold text-sm shadow-inner"
                        />
                    </div>

                    {/* Role Filter Dropdown */}
                    <div className="md:col-span-3">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold text-sm shadow-inner">
                                <SelectValue placeholder="Filter by Role" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                <SelectItem value="all" className="rounded-xl font-semibold">All Roles</SelectItem>
                                <SelectItem value="admin" className="rounded-xl font-semibold">Administrator</SelectItem>
                                <SelectItem value="printer" className="rounded-xl font-semibold">Printer Partner</SelectItem>
                                <SelectItem value="client" className="rounded-xl font-semibold">Client / Customer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="md:col-span-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-semibold text-sm shadow-inner">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                                <SelectItem value="all" className="rounded-xl font-semibold">All Statuses</SelectItem>
                                <SelectItem value="active" className="rounded-xl font-semibold">Active Accounts</SelectItem>
                                <SelectItem value="inactive" className="rounded-xl font-semibold">Inactive Accounts</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>Showing <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> of <strong className="text-slate-900 dark:text-white">{users.length}</strong> total accounts</span>
                    {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold animate-pulse">Active Filters Applied</span>
                    )}
                </div>
            </div>

            {/* Users Directory Grid */}
            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Fetching user directory and access credentials...</p>
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <Card key={user.id} className="group border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
                            <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row justify-between items-start gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md flex-shrink-0">
                                        <AvatarImage src={user.profileImage || undefined} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-lg rounded-2xl">
                                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                            {user.name || <span className="italic text-slate-400 dark:text-slate-600">No Name Provided</span>}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> {user.email}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Assigned Role</p>
                                        <Badge variant="outline" className={`h-7 px-3 rounded-xl font-extrabold text-xs capitalize shadow-sm ${
                                            user.role === 'admin' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                                            user.role === 'printer' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                                            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                        }`}>
                                            {user.role}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Joined Date
                                        </p>
                                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 pt-1">
                                            {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account Access</p>
                                </div>
                                <UserStatusToggle user={user} onStatusChange={handleLocalStatusUpdate} />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center px-4 gap-4">
                    <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                        <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No Matching Accounts Found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">No users matched your current search query or filter configuration. Try adjusting your search keywords or resetting the active filters above.</p>
                    {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="h-10 px-4 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-800 shadow-sm mt-2">
                            Reset All Filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
