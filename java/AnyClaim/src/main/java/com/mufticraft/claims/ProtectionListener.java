package com.mufticraft.claims;

import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;

public final class ProtectionListener implements Listener {

    private final MufticraftClaimsPlugin plugin;
    private final ClaimManager claimManager;

    // flip to true for a 100% sanity test that your listener is actually running
    private static final boolean FORCE_BLOCK_ALL_BREAKS = false;

    public ProtectionListener(MufticraftClaimsPlugin plugin, ClaimManager claimManager) {
        this.plugin = plugin;
        this.claimManager = claimManager;
    }

    /**
     * Debug protection:
     * - Logs every break attempt
     * - Cancels if claimed
     */
    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = false)
    public void onBreak(BlockBreakEvent event) {
        Player p = event.getPlayer();
        Block b = event.getBlock();
        Location loc = b.getLocation();

        String world = loc.getWorld() != null ? loc.getWorld().getName() : "null";
        int x = loc.getBlockX();
        int y = loc.getBlockY();
        int z = loc.getBlockZ();

        // Always log so we can prove handler is running
        plugin.getLogger().info("[DBG] BlockBreak by " + p.getName()
                + " op=" + p.isOp()
                + " permBypass=" + p.hasPermission("mufticraft.claims.bypass")
                + " at " + world + " " + x + "," + y + "," + z
                + " cancelledInitially=" + event.isCancelled());

        // SANITY TEST: if true, nobody can break anything anywhere (confirms jar + listener)
        if (FORCE_BLOCK_ALL_BREAKS) {
            event.setCancelled(true);
            p.sendActionBar(ChatColor.RED + "DBG: breaking blocked everywhere (listener running).");
            plugin.getLogger().info("[DBG] FORCE_BLOCK_ALL_BREAKS -> cancelled");
            return;
        }

        // For debugging, disable bypass so we don't accidentally allow ourselves
        // if (p.hasPermission("mufticraft.claims.bypass")) return;

        boolean claimed = false;
        try {
            claimed = claimManager.isClaimed(loc);
        } catch (Exception ex) {
            plugin.getLogger().warning("[DBG] isClaimed threw: " + ex.getMessage());
        }

        plugin.getLogger().info("[DBG] isClaimed=" + claimed);

        if (claimed) {
            event.setCancelled(true);
            p.sendActionBar(ChatColor.RED + "This area is claimed (debug: no breaking).");
            plugin.getLogger().info("[DBG] cancelled break inside claim");
        }
    }
}
