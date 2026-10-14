document.addEventListener("DOMContentLoaded", function () {
    loadApprovedAchievements();

    document.getElementById("achievementSearch")
        ?.addEventListener("input", filterAchievements);

    document.getElementById("categoryFilter")
        ?.addEventListener("change", filterAchievements);

    document.getElementById("levelFilter")
        ?.addEventListener("change", filterAchievements);

    document.getElementById("sortAchievements")
        ?.addEventListener("change", filterAchievements);
});

let allAchievements = [];


// LOAD APPROVED ACHIEVEMENTS FROM MONGODB
async function loadApprovedAchievements() {
    const achievementList = document.getElementById("achievementList");

    if (!achievementList) return;

    try {
        const response = await fetch("/api/achievements/approved");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load achievements");
        }

        allAchievements = data.achievements || [];

        filterAchievements();

    } catch (error) {
        console.error("Error loading achievements:", error);

        achievementList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-circle fs-1"></i>
                <h3 class="mt-3">Unable to load achievements</h3>
                <p>Please check your server and try again.</p>
                <button class="btn btn-primary" onclick="loadApprovedAchievements()">
                    Try Again
                </button>
            </div>
        `;

        const resultsCount = document.getElementById("resultsCount");

        if (resultsCount) {
            resultsCount.textContent = "Unable to load achievements.";
        }
    }
}


// SEARCH, FILTER AND SORT
function filterAchievements() {
    const searchText =
        (document.getElementById("achievementSearch")?.value || "")
            .trim()
            .toLowerCase();

    const selectedCategory =
        (document.getElementById("categoryFilter")?.value || "")
            .toLowerCase();

    const selectedLevel =
        (document.getElementById("levelFilter")?.value || "")
            .toLowerCase();

    const sortOrder =
        document.getElementById("sortAchievements")?.value || "newest";


    let filtered = allAchievements.filter(function (achievement) {
        const student = achievement.student || {};

        const searchableText = [
            achievement.title,
            achievement.description,
            achievement.category,
            achievement.level,
            student.name,
            student.department
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const category = (achievement.category || "").toLowerCase();
        const level = (achievement.level || "").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);

        const matchesCategory =
            !selectedCategory || category === selectedCategory;

        const matchesLevel =
            !selectedLevel || level === selectedLevel;

        return matchesSearch && matchesCategory && matchesLevel;
    });


    // SORT ACHIEVEMENTS
    if (sortOrder === "newest") {
        filtered.sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

    } else if (sortOrder === "oldest") {
        filtered.sort(function (a, b) {
            return new Date(a.date || 0) - new Date(b.date || 0);
        });

    } else if (sortOrder === "title") {
        filtered.sort(function (a, b) {
            return (a.title || "").localeCompare(b.title || "");
        });
    }

    renderAchievements(filtered);
}


// DISPLAY ACHIEVEMENT CARDS
function renderAchievements(achievements) {
    const achievementList = document.getElementById("achievementList");

    if (!achievementList) return;


    // DISPLAY RESULT COUNT
    const resultsCount = document.getElementById("resultsCount");

    if (resultsCount) {
        resultsCount.textContent =
            `Showing ${achievements.length} achievement(s)`;
    }


    // NO RESULTS MESSAGE
    if (achievements.length === 0) {
        achievementList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search fs-1"></i>
                <h3 class="mt-3">No achievements found</h3>
                <p>Try another search or change your filters.</p>

                <button class="btn btn-outline-primary" onclick="resetFilters()">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }


    // GENERATE ACHIEVEMENT CARDS
    achievementList.innerHTML = achievements.map(function (achievement) {
        const student = achievement.student || {};

        const studentName = student.name || "Student";
        const department = student.department || "Student";
        const category = achievement.category || "Achievement";
        const title = achievement.title || "Achievement";
        const description = achievement.description || "Student achievement";
        const level = achievement.level || "College";

        const year = achievement.date
            ? new Date(achievement.date).getFullYear()
            : "";

        const firstLetter = studentName.charAt(0).toUpperCase();

        let imageClass = "sports";

        if (/academic/i.test(category)) {
            imageClass = "academic";
        } else if (/technology|technical|research/i.test(category)) {
            imageClass = "technology";
        }


        return `
            <div class="col-lg-4 col-md-6">
                <div class="achievement-card h-100">

                    <div class="achievement-image ${imageClass}">

                        <div class="category-badge">
                            ${escapeHtml(category)}
                        </div>

                        <div class="big-card-icon">
                            <i class="bi bi-trophy-fill"></i>
                        </div>

                    </div>

                    <div class="achievement-content">

                        <div class="achievement-meta">

                            <span>
                                <i class="bi bi-calendar3"></i>
                                ${escapeHtml(year)}
                            </span>

                            <span class="verified-text">
                                <i class="bi bi-patch-check-fill"></i>
                                Verified
                            </span>

                        </div>

                        <h3>${escapeHtml(title)}</h3>

                        <p>${escapeHtml(description)}</p>

                        <div class="student-info">

                            <div class="student-avatar">
                                ${escapeHtml(firstLetter)}
                            </div>

                            <div>
                                <strong>${escapeHtml(studentName)}</strong>
                                <small>${escapeHtml(department)}</small>
                            </div>

                            <span class="ms-auto">
                                ${escapeHtml(level)}
                            </span>

                        </div>

                    </div>

                </div>
            </div>
        `;
    }).join("");
}


// CLEAR ALL FILTERS
function resetFilters() {
    const searchInput = document.getElementById("achievementSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const levelFilter = document.getElementById("levelFilter");
    const sortSelect = document.getElementById("sortAchievements");

    if (searchInput) searchInput.value = "";
    if (categoryFilter) categoryFilter.value = "";
    if (levelFilter) levelFilter.value = "";
    if (sortSelect) sortSelect.value = "newest";

    filterAchievements();
}


// PREVENT HTML INJECTION
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}