package com.mufticraft.claims;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.google.gson.annotations.SerializedName;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public final class ClaimManager {

    private final JavaPlugin plugin;
    private final Gson gson = new Gson();

    // thread-safe list (we read from main thread, update from async polling)
    private final List<Claim> claims = new CopyOnWriteArrayList<>();

    private final Path inboxDir;
    private final Path processedDir;

    // Avoid reloading same files repeatedly
    private final Set<String> seenFiles = Collections.synchronizedSet(new HashSet<>());

    public ClaimManager(JavaPlugin plugin) {
        this.plugin = plugin;

        String inboxPath = plugin.getConfig().getString("inbox_dir", "/opt/minecraft/claims/inbox");
        this.inboxDir = Paths.get(inboxPath);
        this.processedDir = Paths.get(plugin.getConfig().getString("processed_dir", "/opt/minecraft/claims/processed"));
    }

    public int getClaimCount() {
        return claims.size();
    }

    /**
     * Full reload: clears all and loads everything from processed + inbox (for convenience).
     */
    public void loadAllClaims() {
        try {
            Files.createDirectories(inboxDir);
            Files.createDirectories(processedDir);
        } catch (IOException e) {
            plugin.getLogger().severe("Failed creating claim directories: " + e.getMessage());
            return;
        }

        claims.clear();
        seenFiles.clear();

        // Load processed first (stable)
        loadClaimsFromDirectory(processedDir, false);
        // Load inbox too (in case you haven't moved them yet)
        loadClaimsFromDirectory(inboxDir, false);

        plugin.getLogger().info("Loaded claims: " + claims.size());
    }

    /**
     * Incremental load: read only new files from inbox, then move them to processed.
     */
    public void loadNewClaimsFromInbox() {
        try {
            Files.createDirectories(inboxDir);
            Files.createDirectories(processedDir);
        } catch (IOException e) {
            plugin.getLogger().severe("Failed creating claim directories: " + e.getMessage());
            return;
        }

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(inboxDir, "*.json")) {
            for (Path p : stream) {
                String fname = p.getFileName().toString();
                if (seenFiles.contains(fname)) continue;

                Claim claim = parseClaimFile(p);
                if (claim != null) {
                    claims.add(claim);
                    plugin.getLogger().info("Loaded claim from inbox: " + fname + " (world=" + claim.worldName + ")");
                }

                // Mark seen either way so a bad file doesn't spam reload attempts
                seenFiles.add(fname);

                // Move to processed so inbox stays clean
                try {
                    Files.move(p, processedDir.resolve(fname), StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException moveErr) {
                    plugin.getLogger().warning("Could not move " + fname + " to processed: " + moveErr.getMessage());
                }
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Error reading inbox directory: " + e.getMessage());
        }
    }

    private void loadClaimsFromDirectory(Path dir, boolean markSeen) {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, "*.json")) {
            for (Path p : stream) {
                String fname = p.getFileName().toString();
                Claim claim = parseClaimFile(p);
                if (claim != null) {
                    claims.add(claim);
                }
                if (markSeen) seenFiles.add(fname);
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Error reading directory " + dir + ": " + e.getMessage());
        }
    }

    private Claim parseClaimFile(Path file) {
        try (Reader r = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            ClaimPayload payload = gson.fromJson(r, ClaimPayload.class);
            if (payload == null) return null;
            if (payload.world == null || payload.world.isBlank()) {
                plugin.getLogger().warning("Claim missing world in " + file.getFileName());
                return null;
            }
            if (payload.vertices == null || payload.vertices.size() < 3) {
                plugin.getLogger().warning("Claim needs >=3 vertices in " + file.getFileName());
                return null;
            }

            return Claim.fromPayload(payload);
        } catch (IOException | JsonParseException e) {
            plugin.getLogger().warning("Failed parsing " + file.getFileName() + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * Returns true if this Location is inside ANY claim polygon in the same world.
     * Uses bounding box precheck + point-in-polygon (ray casting).
     */
    public boolean isClaimed(Location loc) {
        World w = loc.getWorld();
        if (w == null) return false;

        int x = loc.getBlockX();
        int z = loc.getBlockZ();

        for (Claim c : claims) {
            if (!c.worldName.equalsIgnoreCase(w.getName())) continue;
            if (x < c.minX || x > c.maxX || z < c.minZ || z > c.maxZ) continue;
            if (c.containsBlockXZ(x, z)) return true;
        }
        return false;
    }

    // JSON shape expected from your API
    private static final class ClaimPayload {
        String world;
        @SerializedName("vertices")
        List<Vertex> vertices;
    }

    private static final class Vertex {
        int x;
        int z;
    }

    /**
     * Internal claim model
     */
    private static final class Claim {
        final String worldName;
        final List<int[]> poly; // each int[]{x,z}
        final int minX, maxX, minZ, maxZ;

        private Claim(String worldName, List<int[]> poly, int minX, int maxX, int minZ, int maxZ) {
            this.worldName = worldName;
            this.poly = poly;
            this.minX = minX;
            this.maxX = maxX;
            this.minZ = minZ;
            this.maxZ = maxZ;
        }

        static Claim fromPayload(ClaimPayload payload) {
            int minX = Integer.MAX_VALUE, maxX = Integer.MIN_VALUE;
            int minZ = Integer.MAX_VALUE, maxZ = Integer.MIN_VALUE;

            List<int[]> poly = new ArrayList<>(payload.vertices.size());
            for (Vertex v : payload.vertices) {
                int x = v.x;
                int z = v.z;
                poly.add(new int[]{x, z});
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (z < minZ) minZ = z;
                if (z > maxZ) maxZ = z;
            }

            return new Claim(payload.world, poly, minX, maxX, minZ, maxZ);
        }

        /**
         * Point-in-polygon on XZ using block center for stability.
         */
        boolean containsBlockXZ(int blockX, int blockZ) {
            double px = blockX + 0.5;
            double pz = blockZ + 0.5;

            boolean inside = false;
            int n = poly.size();

            for (int i = 0, j = n - 1; i < n; j = i++) {
                double xi = poly.get(i)[0] + 0.5;
                double zi = poly.get(i)[1] + 0.5;
                double xj = poly.get(j)[0] + 0.5;
                double zj = poly.get(j)[1] + 0.5;

                boolean intersect = ((zi > pz) != (zj > pz)) &&
                        (px < (xj - xi) * (pz - zi) / (zj - zi + 0.0) + xi);

                if (intersect) inside = !inside;
            }
            return inside;
        }
    }
}
