const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const zlib = require('zlib');

function checkBuildSize() {
    const buildDir = path.join(__dirname, '../build');

    // Check if build directory exists
    if (!fs.existsSync(buildDir)) {
        console.log('❌ Build directory not found!');
        console.log('🔨 Building project...\n');

        try {
            // Run npm build
            execSync('npm run build', {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
            console.log('\n✅ Build completed!\n');
        } catch (error) {
            console.log('❌ Build failed!');
            process.exit(1);
        }
    }

    console.log('📊 Analyzing build directory...\n');
    console.log('━'.repeat(60));

    let totalSize = 0;
    let totalGzipSize = 0;
    let fileCount = 0;
    const filesByType = {};

    // Recursively get all files and their sizes
    function analyzeDirectory(dirPath, prefix = '') {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                analyzeDirectory(fullPath, prefix + file + '/');
            } else {
                const size = stat.size;
                const fileContent = fs.readFileSync(fullPath);
                const gzipSize = zlib.gzipSync(fileContent).length;

                totalSize += size;
                totalGzipSize += gzipSize;
                fileCount++;

                // Group by extension
                const ext = path.extname(file).toLowerCase() || 'no-extension';
                if (!filesByType[ext]) {
                    filesByType[ext] = { count: 0, size: 0, gzipSize: 0 };
                }
                filesByType[ext].count++;
                filesByType[ext].size += size;
                filesByType[ext].gzipSize += gzipSize;
            }
        });
    }

    analyzeDirectory(buildDir);

    // Display summary
    console.log('📦 BUILD SUMMARY');
    console.log('━'.repeat(60));
    console.log(`📁 Total Files: ${fileCount}`);
    console.log(`📊 Uncompressed: ${formatBytes(totalSize)}`);
    console.log(`📦 Gzipped: ${formatBytes(totalGzipSize)} (${((totalGzipSize / totalSize) * 100).toFixed(1)}% of original)`);
    console.log('');

    // Display by file type with gzip sizes
    console.log('📋 FILE SIZES AFTER GZIP (like React build output)');
    console.log('━'.repeat(60));

    const sortedTypes = Object.entries(filesByType)
        .filter(([ext]) => ext !== '.map') // Exclude source maps like React does
        .sort((a, b) => b[1].gzipSize - a[1].gzipSize);

    sortedTypes.forEach(([ext, data]) => {
        console.log(`  ${formatBytes(data.gzipSize).padStart(10)}  ${ext} (${data.count} file${data.count > 1 ? 's' : ''})`);
    });

    console.log('');
    console.log('📋 FULL BREAKDOWN (including source maps)');
    console.log('━'.repeat(60));

    const allTypes = Object.entries(filesByType)
        .sort((a, b) => b[1].size - a[1].size);

    allTypes.forEach(([ext, data]) => {
        const percentage = ((data.size / totalSize) * 100).toFixed(1);
        console.log(`${ext.padEnd(15)} ${String(data.count).padStart(2)} files  ${formatBytes(data.size).padStart(10)} → ${formatBytes(data.gzipSize).padStart(10)} gzipped  (${percentage}%)`);
    });

    console.log('━'.repeat(60));

    // Pinata limits info
    console.log('\n💡 PINATA LIMITS (Free Plan)');
    console.log('━'.repeat(60));
    console.log('Max file size: 100 MB per file');
    console.log('Monthly bandwidth: 1 GB');
    console.log('Storage: 1 GB total');
    console.log('');

    // Check if size is reasonable
    if (totalSize > 100 * 1024 * 1024) {
        console.log('⚠️  WARNING: Build is larger than 100 MB!');
        console.log('   Consider optimizing your build or upgrading Pinata plan.');
    } else if (totalSize > 10 * 1024 * 1024) {
        console.log('⚠️  Build is over 10 MB. Consider optimization if possible.');
    } else {
        console.log('✅ Build size looks good for IPFS upload!');
    }

    console.log('━'.repeat(60));
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Run the check
checkBuildSize();

