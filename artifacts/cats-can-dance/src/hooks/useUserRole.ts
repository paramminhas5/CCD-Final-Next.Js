/**
 * useUserRole — reads the current user's role from our DB
 * Returns: role, entityId, entitySlug, isArtist, isPromoter, isVenue, isAdmin
 *
 * Role hierarchy:
 *   user → normal dashboard (likes, RSVPs, bookmarks)
 *   artist → can edit their artist profile, generate + download EPK
 *   promoter → can create/manage events
 *   venue → can manage their venue profile
 *   admin → all access
 */
import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";

export type UserRole = "user" | "artist" | "promoter" | "venue" | "admin";

export interface RoleInfo {
  role: UserRole;
  entityId: string | null;
  entitySlug: string | null;
  entityName: string | null;
  loading: boolean;
  isArtist: boolean;
  isPromoter: boolean;
  isVenue: boolean;
  isAdmin: boolean;
}

const CACHE: Record<string, { data: RoleInfo; ts: number }> = {};
const TTL = 5 * 60 * 1000; // 5 min

export function useUserRole(): RoleInfo {
  const { user, isLoaded } = useUser();
  const [info, setInfo] = useState<RoleInfo>({
    role: "user", entityId: null, entitySlug: null, entityName: null,
    loading: true, isArtist: false, isPromoter: false, isVenue: false, isAdmin: false,
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setInfo({ role:"user", entityId:null, entitySlug:null, entityName:null, loading:false, isArtist:false, isPromoter:false, isVenue:false, isAdmin:false });
      return;
    }

    // Check cache
    const cached = CACHE[user.id];
    if (cached && Date.now() - cached.ts < TTL) { setInfo(cached.data); return; }

    fetch(`/api/user-role?user_id=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const role: UserRole = data?.role ?? "user";
        const result: RoleInfo = {
          role,
          entityId: data?.entity_id ?? null,
          entitySlug: data?.entity_slug ?? null,
          entityName: data?.entity_name ?? null,
          loading: false,
          isArtist: role === "artist" || role === "admin",
          isPromoter: role === "promoter" || role === "admin",
          isVenue: role === "venue" || role === "admin",
          isAdmin: role === "admin",
        };
        CACHE[user.id] = { data: result, ts: Date.now() };
        setInfo(result);
      })
      .catch(() => {
        setInfo(prev => ({ ...prev, loading: false }));
      });
  }, [user?.id, isLoaded]);

  return info;
}

/** Invalidate the role cache (call after role changes) */
export function invalidateRoleCache(userId: string) {
  delete CACHE[userId];
}
