package com.mufticraft.claims;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;

public final class MufticraftClaimsPlugin extends JavaPlugin {

    private ClaimManager claimManager;

    // Loaded from plugins/MufticraftClaims/config.yml
    // claims:
    //   api_url: "https://api.mufticraft.store/api/claims"
    //   api_token: "YOUR_TOKEN"
    private String claimsApiUrl;
    private String claimsApiToken;

    @Override
    public void onEnable() {
        // Creates plugins/MufticraftClaims/config.yml on first run (from src/main/resources/config.yml)
        saveDefaultConfig();

        // Load token + url from config.yml
        this.claimsApiUrl = getConfig().getString("claims.api_url", "https://api.mufticraft.store/api/claims");
        this.claimsApiToken = getConfig().getString("claims.api_token", "").trim();

        // Warn loudly if missing
        if (claimsApiToken.isEmpty()) {
            getLogger().severe("==============================================");
            getLogger().severe("MufticraftClaims: claims.api_token is NOT set!");
            getLogger().severe("Edit: plugins/MufticraftClaims/config.yml");
            getLogger().severe("Then restart the server or /claims reload.");
            getLogger().severe("==============================================");
        } else {
            getLogger().info("MufticraftClaims: claims.api_token loaded (" + claimsApiToken.length() + " chars).");
        }

        this.claimManager = new ClaimManager(this);

        // Load existing claims on startup
        claimManager.loadAllClaims();

        // Poll inbox every N seconds for new JSON files
        int seconds = getConfig().getInt("inbox_poll_seconds", 5);
        Bukkit.getScheduler().runTaskTimerAsynchronously(
                this,
                () -> {
                    try {
                        claimManager.loadNewClaimsFromInbox();
                    } catch (Exception e) {
                        getLogger().warning("Error while polling inbox: " + e.getMessage());
                    }
                },
                20L * seconds,
                20L * seconds
        );

        // Register protection listener
        Bukkit.getPluginManager().registerEvents(new ProtectionListener(this, claimManager), this);

        getLogger().info("MufticraftClaims enabled. Loaded claims: " + claimManager.getClaimCount());
    }

    @Override
    public void onDisable() {
        getLogger().info("MufticraftClaims disabled.");
    }

    /** Expose API URL for other classes (if you later have the plugin call the API). */
    public String getClaimsApiUrl() {
        return claimsApiUrl;
    }

    /** Expose API token for other classes (if you later have the plugin call the API). */
    public String getClaimsApiToken() {
        return claimsApiToken;
    }

    // Simple admin command
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!command.getName().equalsIgnoreCase("claims")) return false;

        if (args.length == 1 && args[0].equalsIgnoreCase("reload")) {
            // reload config so token/url changes apply without full restart
            reloadConfig();
            this.claimsApiUrl = getConfig().getString("claims.api_url", "https://api.mufticraft.store/api/claims");
            this.claimsApiToken = getConfig().getString("claims.api_token", "").trim();

            claimManager.loadAllClaims();

            sender.sendMessage(ChatColor.YELLOW + "[Claims] Reloaded. Claims=" + claimManager.getClaimCount());

            if (claimsApiToken.isEmpty()) {
                sender.sendMessage(ChatColor.RED + "[Claims] WARNING: claims.api_token is not set in config.yml");
            } else {
                sender.sendMessage(ChatColor.GREEN + "[Claims] claims.api_token loaded (" + claimsApiToken.length() + " chars)");
            }
            return true;
        }

        sender.sendMessage(ChatColor.YELLOW + "Usage: /claims reload");
        return true;
    }
}
