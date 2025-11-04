<?php 
session_start();
if (!isset($_SESSION['username'])) {
    header("Location: welcomepage.html");
    exit();
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Dashboard | One Coin to Rule</title>
    
    <!-- Link to CSS file -->
    <link rel="stylesheet" href="css_files/homepage.css">
    <link rel="stylesheet" href="css_files/accountpage.css">

    <!-- Link to JavaScript files -->
    <script src="js_files/homepage.js" defer></script>
    <script src="js_files/accountpage.js"></script>

    <!--links to various icons, from flaticon & fontawesome-->
    <script src="https://kit.fontawesome.com/8d07e5d887.js" crossorigin="anonymous"></script>

</head>
<body>
    <header class="navbar-outer">
        <div class="navbar-inner">
            <div class="logo">Coin 💰</div>
            <nav>
                <ul class="nav-links">
                    <li><a href="homepage.php" class="nav-item active">Home</a></li>
                    <li class="nav-item-dropdown-container">
                        <a href="#" class="nav-item linkAbout">About <i class="fas fa-caret-down"></i></a>
                        <ul class="nav-item-dropdown">
                            <li><a href="accountpage.html">Account</a></li>
                            <li><a href="php/logout.php">LogOut</a></li>
                        </ul>
                    </li>
                </ul>
            </nav>    
        </div>
    </header>

    <main class="dashboard">
        <!-- welcome card, with username and date -->
        <section class="welcome-card">
            <div class="par1">
                <!-- <p class="p1">Lo, <span id="reg_name">Username</span>! Let us now peruse with your budget, one coin at a time 💸 </p> -->
                <!-- modified this to allow username for the session -->
                <p class="p1">Lo, <span id="reg_name"><?php echo htmlspecialchars($_SESSION["username"]) ?></span>
                ! Let us now peruse with your budget, one coin at a time 💸 </p>
            </div>
            <!-- div contains the date -->
            <div class="date_div">
                <p class="date"> Today: <span id="date"></span></p>
            </div> 
        </section>

        <!-- More dashboard sections here -->
        <section class="content_container">
            <!-- left container with summary div card and distribution pie chart card -->
            <div class="left_container">
                <!-- here is the budget to be set -->
                <div class="budget_card">
                    <h2>Budget</h2>
                    <div class="budget_details">
                        <label for="budget_amount">Amount:</label>
                        <!-- select currency -->
                        <!-- <div class="exp_amount"> -->
                            <span id="currency_option">€</span>
                        <!-- </div> -->
                        <input type="number" id="budget_amount" placeholder="Enter amount" />
                        <!-- save budget button -->
                        <button type="submit" id="set_budget_btn">save</button>
                    </div>
                    <!-- choose month drop down -->
                    <div class="month_select">
                        <label for="month_select">Month:</label>
                        <select id="month_select">
                            <?php
                            $currentMonth = date('F');
                            $months = ['January', 'February', 'March', 'April', 'May', 'June', 
                                     'July', 'August', 'September', 'October', 'November', 'December'];
                            foreach ($months as $month) {
                                $selected = ($month === $currentMonth) ? 'selected' : '';
                                echo "<option value=\"$month\" $selected>$month</option>";
                            }
                            ?>
                        </select>
                    </div>                    
                    <!-- set budget for different categories -->
                    <div class="add_categories">
                        <button id="add_categories_btn">+ Allocate Amount</button>
                        <!-- categories added dynamically --> 
                        <div class="categories_container" id="categories_container"> 
                            <!-- adds cards dynamically -->
                            <!-- should rather use a dropdown of pre-selected options ?????-->

                            <!-- popup div to create categories -->
                            <div class="add_category_popup hidden" id="addCategoryPopup">
                                <div class="add_category_div">
                                    <button id="closeCategoryForm" class="closeForm">&times</button>
                                    <h3>Add Category</h3>
                                    <form>
                                        <label for="category_name">Category Name: </label>
                                        <select id="category_name" name="category_name">
                                            <!-- important to keep the names as they appear -->
                                            <option value="Shopping">Shopping</option>
                                            <option value="Health">Health</option>
                                            <option value="Rent & Bills">Rent & Bills</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Groceries">Groceries</option>
                                            <option value="Restaurant">Restaurant</option>
                                            <option value="Entertainment">Entertainment</option>
                                            <option value="Transport">Transport</option>
                                            <option value="Impromptu">Impromptu</option>
                                            <option value="Others">Others</option>
                                        </select>

                                        <!-- <input type="text" id="category_name" name="category_name" placeholder="Name" required /> -->
                                        <label for="category_amount">Amount: </label>
                                        <input type="number" id="category_amount" name="category_amount" placeholder="Amount" required />
                                        <button type="submit" id="submitCategory">save</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- spent so far in the current month-->
                <div class="summary_card">
                    <h2>Summary in <span id="current_month">month</span></h2>
                    <div class="summary_pie">
                        <canvas id="summaryDoughnut" width="200" height="170"></canvas>
                        <div class="summary_text" id="summaryText">0% of €<span id="get_budget_amount"></span> spent.</div>
                    </div>
                    <!-- days left in month -->
                    <div class="days_left">
                        <span id="daysLeftText"></span>
                        <progress id="daysProgress" value="0" max="31"></progress>
                    </div>
                </div>
            </div>
            <!-- right container with different expenditure categories -->
            <div class="right_container">
                <div class="exp_heading">
                    <h2>Expenditure & Overview</h2>
                    <button type="menu" class="add_expense_btn" id="add_expense_btn">Add Expenses</button>
                </div>
                <!-- list of expenditure categories and monthly overview -->
                <div class="exp-categories_months-oveview">
                    <!-- list of categories -->
                    <div class="exp_categories_group">

                        <!-- sample categorie -->
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB3ElEQVR4nO2XP0sDMRiHf4ro6izqB3ARHNpBFEG4okJvUsF20cniHxTEReUG0bwngpSaHH4AHfwAbq7iJDgJjlp111EhkquDhTrYJpcG7oEsBy/5PXnfBA5ISUlJaR9KhRmUClWsLUqEOxKCJDj7AmeP4LSNIOhCW7NcfEapKOO1vlgTqF8XcFxAQlAObcvywlQsocIf7TYW4HQOp4gORv/ohJ0VseH/CUjZAUFP1oOL+EG5aq4LnJWthxckcRpONicgwjHr4QW7j6ehKYKgE4K9WB6fIlqCs4q98FTFZdDdmsApG7cosIWWUWPE6dXC6Lzj5KQXWhCMWzj9Y2gjYhMJC3zijAb1CcSvUaKnfw7tJClQCUfcFeB0rT98kgLR4bS7Apwe4vvmrIBgS2bCJyLA3lAu97gpwKkKfuiZC99IwDmE6wKcvdcJlKkfTiHotn5u2RX4/gCcIaJV4y+RUdSfEac7dwUUlbDPqEQiqE4ItgJONxD04Z7AD0Ozs91ZLx9mvfxrJue/ZHJ5Ut9guFYbatNszpe/l/pmulYb6vTUxvObe3Juc68WxPPfTNdqQ7VebawCzG3UQmQ8v2q6VhuNx8Bnpmu1oS6dClK7hP+/xJkma1NSUlLQFnwDX7MckiLnGesAAAAASUVORK5CYII=" alt="shopping-cart--v1">
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Shopping</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>

                        <!-- sample categories -->
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE8UlEQVR4nO1ZXWwURRxfTUxMfDA+afwKmhhf1AfvZvYs1bMz24KKWMAIWiomaqMWWgUjGk2KEKUNIqLGz0qiQAkoYkHEl0aNPAjhxaSXHFSLtZbSYgllZm/vuLsdM7O3e3u3e3d7H+3V5P7JP3c7N/uf3+//MV8nSTWpSU1qMuclovhuJhisIQj+SDEMEwQpwUAjCIwRBI9QBF/RgvI8r/a0RngLRWA9t0cQPGPYgjRlm7etjjT5byobuBqENxIEviAIJCiGLJ+KPgjuzjcwdwTFoM+rPYJBr4oCN5QGHsFmigEpNJBTwUWC/cuz7ZEG+Hip9tQGeXFR4AmSOwmCyeIHS3kPQ50g+KJlD4O1vK1kewgmCQYdnj3vGfyD9+Ungf3LCZJXlAOe2kgUjATPea9hVpsbWfStroLhN7Q88NSeTkrd9blTB4MdXo1Fu15l8e++rRAwWEx6fp57qvQwO5ga3/8104f+mH0CCCR4prh5v8OzIUUW4Nm58yzSurQKJGC7kwBfkDwaiDz9hADPNbp5QxXSCBx2EKAYDHk1EPtgq0WgGnVAMQy7EfC8yCR++dkiUI06oBgQJwEEpl29vX1LxrO6KMjY+ARjZ88xffiv3HWgBFjk+VUzQwDBC24RCGV3jKx6lLHJKRZ56jGrTVvfKUAnjv7K4gcP5KwDreNZlvhpYKaiMOhCAO7L7hjv2ykAXur7ymrj33lb7MP3WKx7Y846iO/ZZUTHRr6Cus9tGm3JSJXFiLF/zhi5PjbO1EewaE8ODhrA2layyJPL3Oug6R6m/zlskOvbWXECBIMWB4Hziu9qeyHHtvVYhSo8/m43i7QsMQAPnxY5zvvpp5zrgbauPf2ujbybai+vZvrJIaaHT4n3CoJHUL1QX3+N5CaJH74/ZgctPLh3twE6FGKxLW87Uibe76yD+Dd7jffHJy3yIv12fJZhm3GdTH/Xwye9ROAdKZdEez+6nY2M6pbBUIjRBXXiUzyn0iK68XXLYLT7TYNU/wGjbeF8po+MGsC3bk7beeBeETkngSnPBMSpLQiuk/KJisBz2S9yD9oHVJcttH6LtGbWgfbaS+I5eew3kWZmzZgzVvL48cwUWtcu0oeD19a+UCj310iFhEnSZRSDgeyC1keNgk6eOOEwbK+D+KF+w/vbegzyqShYW4+CW3DorggeZV3S5ZIXIUi+lmAwajdgTp+Xej9xGDfrQESKz1w8SisWOcjrf4+JhbB4AuBs0Yd8Ffkgvy3IXtS0zjbHAGYd6KdHrEXOlfyuL4ufMhGMXVTk+qLAp0n4HyYYxE1jiSOHGV1Q7xjErANryu3ZlPk7Xy+yVnSP4JP8SCqVIwT5V5pnZHVpU8HzAZv4l6lLnP1iH79fHHgMdRXLbWWBT0cCNtvTyU3NOkgM5Nj/KHIRngcJisAzUiWFYPl+vgvMNahZB9FNb5Q2y2ArbShV4EMVBW+RaPTfkT07ZdTB+ETebUNBRWBqusFfJ82k8DtQisHvbgDsu9YSNDytyLdJsyEsGLySIrjd7a6oNM/D/XwzKc220AbYmrpVLjXfo/waU6qmECVwJz8hlZIyFAXuluaCMJ/vCoLBBk/X5uLiF3zKGu+6SpproiowIDybkwAYKnlbMKvRQHKn/XTH9zO86Oek1/P9jUQwPEgQPKRh/605O9akJjWpifR/lv8AluPW0z70S5wAAAAASUVORK5CYII=" alt="heart-with-pulse">
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Health</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0 
                                </div>
                            </div>                      
                        </div>

                        <!-- sample categorie -->
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC80lEQVR4nO3XS28SUQAF4GsEChQp70dbjT+gG2NcNl25gAYsNE105a4u1LrTv2LTRF27l2dLaYGWUiotj0jj2r2C3fXeY+4MFlFqhzozTA0nOQkZYPKdGTIJhIwyyiiyBXX/LdT9z9HwJVD3NlH3fUfNw9tE1ZtA1f0MtcmbRGvB8fQUGv5V1P2nqPsgtMbrBape4Mgj9tADVNwUFfd7VLy3iRaChn8BDX/7Qvihm+OBjy6xB64WDpzhYeNfoOajA8KBAydQdgIlB0XZsTIs/IKAvwx83yG25AD27BS7NnXvBI6mplH1tc/g1UvAS3aOByvaQIsTLeSdk+oNqHnenAuv9IGX/4T/xLNd3gnQgnVNvUdl1XMqDe68EM52xNKC9RRFx7TyAw5dK71w9z/BWcEKlue9AeTGnyo/oOKKyw1nObF02/JBjQGf5YazbQvYlgU0a24qP6DsbMsNZ1vjYNlxPqCtwgBHS2444900g2ZM35QfsG9vivjf4MU+8MJ5cEsPnGXE0nXTJ+UHlGxJaXBrL3y7D3yzg98wCaVpY1L5AXv2V124TRY4WzcKxbrxpfIDSvYZueEsbQRLjQFJ/QxRI7QwUZQTzlJjoAnDPlErKFgfyQVnSYNQxPQP1RuwSXQ0ZzmWA84SBtC47pifU7UBwogty2LPs/xXeOZv8A4+YQCL64UiboiqihcGgFyjWXO+P9zUhaf7wBMinMX1oHF9np9L9QHCiKz5Ds2Y6WXgHTxFTHePDDN0w/RuUPjZgJjuLRl2kDJN0rTxZBB45+qf8O8SLYSmDKtS4d2rr39NtBLEdbNS4d0nj26WaCWIEatU+NmAGLESLWXQAURrYVd9QDAcxSAlWktwNGDIufJ3IBCKtiQPCEW+Eq0lEIoUBrgDOaK1BB9EnkgdMB+KLhOt5e7ysj4QihQlDNidm5tT99+X1NyPRDyBcHTnPDz/mfHPEC1naWnp+nxo8XEwHE0FQtEvvPw1P8bfG7ZvlFH+t/wAbO4Rr+e4FiQAAAAASUVORK5CYII=" alt="light--v1">                            
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Rent & Bills</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>
                        
                        <!-- sample categorie -->
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADKElEQVR4nO2ZS2hTQRSGRwSLLgQtIj5Rl4IIblRQ28xJzpnaduEiCxd15QNc6MqNIvjYFNuCBSnaNplJ0pdxpVDrwo0Vaitqja0IVTculIJWEaporVcmsW1Smued25tCfphVAvN9Z2Zu7pwwVkoppTgTiy0DSfUg6SJbatkX9a8EiV2gyNKDS7yqhdhSiC/s2w6Kns3Az0lQSIuxYg6Xwg8SJ+bDzw18zQNiJyu2VETEZlAYTQ+etBIKJ0HSJX/Uv8JtboZtuBYUXY5D5QCfKkLDIFG4Ag4B2AGSGkDh93zBFxLxKDpac6tmlSOwolmUUYQ2eKUAXW2QGLMLveCQ+AMU9kJInK4M+/aKgFhnZJuBpL+OAOd2XqbtCyj67ZqAxF8mBL66JQASJ2wLcEUf3NtC9MH+Ckgacm8FaNCEwB3XBBRGbQtwiU0moXwhYXXEblrnH57L5fuN9gUUnTUJ3xlrtd59GbTGPj/JKqHnti3gUb5DZuCrrJ6R9jj8zOiMtWY7A5W2BfRPPEiaMlX5mREdDcSl0lcfp0VErGYmwiW+yAR48t4J6/pAfdrKd79qS4HXK5EJHhL3hxEj8AkBakkPf9waHe+Pg7U8bbJdeZjb/wFjAh5JdekmuvumIwXwxmDDLHzXvMrfHskNHhICp4wJQAjKucQ/C01U3VFrPXgbTZUYarQFD4qsCknbmMlwiY/TTVYVqbXuj/WkABeybWB24HNmOiDpTKZJ00nkD0/6LfSCeYEQlIOin/lIFASvcBqDuMW4QFwiqdeTSaJ3rDsOj+HDecFD4vD2MafCg7Qnlxualsi38vB/eENEjgnEJRT1FQKWY/WHHe/gQYj2O3VP5koccRR+VkJh2LwA9i9a/5S38fWZW4h5DklT3mDVLraYAYXHzG0dvMLciH7hMlD9R/6of7krArpdnu1VO8u+/+Rt925kbka3AHXbvIBH5jf9u8KKIVxVb+KK3uex5yd5kA6yYoreCrqPkxVe4kfdvGXFGNEsyrIc7JfekHcrK/Z4JNVxSePJz3mu8FrR/0eWnAOd1Wv0XZpLHPAEcHfKh6WUUgozlX9RsK/0qxn/FQAAAABJRU5ErkJggg==" alt="security-checked--v1">
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Insurance</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>

                        <!-- sample categorie -->                                      
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADP0lEQVR4nO2Wb0gTYRzHn94Uvggk9yLCbRDkkLJ8URRBUPTGP9NNSVdEiZvvIrKgl/mmV0V5Jy0qJwTRi7Btd9uVgTIjovKmssiKiCwQol0pIzN3z6X+4m4e2Ghz3h/P6L7wfXP33HPfz/P8nvsdQqZMmTKVTwEHTfSUUb96HDTkdJl4n+pEa1GBMhrnDe/IWByH1qL+eYBbhwd6e8oj+QHKI9B9KHZP85c39TYVOaNOSz1dv1HpHOQwX0PGMSznLjZdpW16hJAz7H7lpNwgupZycU7KdbeaclWsZI7OYf5IIQAkyzdoDxBqOCUDLAGZd4bdlxCgdYXMQQzhk4UAdLL4uOYAVX1VG5yUaywbQrSf3vUNomhGMoNeQxSRwKAd2XOQcf5MgSV0Gumh2mDjttqw+3M2QB3lhrfREgAGLfUcMMgPvWi9/DzBYrKgEorjq0gvne/fv6WD3sfVUa4/IC7Se7MBZMdkCJLF0QIBKN0AgEE3xGBfmSJgIlvhZmQnXKZ3w+3I9lwAAFF0TXyWiOP3hR1i/E6f8A9RBTBoPmfQ3J4bG2g5KIYLJDC8/CLkdCCBgWD5BT87s1l7AAZ1KQgv+cXghUciQOyTAIKQ27GPgrQLxBA+pgfAG6UA958OTIvBxqdwXoDxyUwZEXHM6AHwQ0n46T4bdMVnoTshQBrn34E0FqRxRJyf84/O2rUGmFYC8PgJIa3q84n8qy8s+tnE4i6wmDS8hNIPNsH1oSnwj2D4Prt8eEEQpHHieILlf14ZAYt2AJkOuyKA0cGz0mr2jxe2+sKixfGZXeDPqQ4etDTXBEs8fMjiASMdLPHwYYunWgGAp8Po8CEZwuLp+B8BmtdECYVKmtOKSkhW0upNcDYfGOGk1ZtAasXZfJRRAJzNp/4PlbP5iOyJ5c/lctfkz6OSa1zGhGqApLW13SiApLW1XT1AqddtGECp160agLO3VRpWQva2StUAKXtLsVGHOGVvKVYNIO2C48TCaodPWn0ppJUm9zSmV7uEklr0AFlTB+o/GHAGKM0AJiuP3jEAgNAMILsXrE4JtbZrB/CXXqD7IS7VoAfk6wW6265BDzCyF6S06gGmTJkyhfTUb196SoqFu9awAAAAAElFTkSuQmCC" alt="ingredients">
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Groceries</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>

                        <!-- sample categorie -->                                      
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADV0lEQVR4nO2Yu2sUQRzH534TnyAqxkosFBsR/AfER0RF1KCFqIj4BksLwUZEBM1MRBSSKjZW4Wan8BWJlVjYKBzszFlYaERUFLUw3m82Xoy6Mksu5p7Zvd0zV+wXpll2Zz6fnZmdnSEkTZo0adK0JDy3OMP1E9Kb39yaBgghw/48EHiIOkZSgW+oMN+owCIIzFGBV4n0VjRdd4bpIeDaB6YNYe6WRMF9PwMOHqECP1LH+HWLQA+EORq5ftqjdgbw/4pHmdqaCPwDfyEIvNMQ3CkvIPFwpDYyXMkKAdsTY5Tlt8WCv/d1EQh8HgWeBj1hkMjC8tDtANcfqgRKEjy/vSl46VMQ+DAyvFPqBXMhgoAarylQkuhxd0TlB4lnm4WnVkCYx+EbY/pzXYFAQhUpU92hK7zzfRkVZjSOAHXwXej2Mlw/aigQFDUeVgIEnosHb6IJANfHZhaY7Ime/K4QArm4AuDgs9ACREoKTOnQEtzdXbeu2/586uDP+D1g+kiksPxq4PpLKIlGw0n+WJUAvN+RLWwkkcNfrAWmPoWT0D+B6+pPnRxdE3/4GG1X7+gC0SX8Dq4ulgv4c6nA8VgSArtIrFzLrw8/nKyEe3764yDM0xgCN0kiidQTyiNMbyo9SrOFG00NHYH37QqejEBkCe3RXreLysJ+KnCiiWFziwz4c5KDn0mCqffA1e+ya/0jRSrwV0Twt1R4+5IHbyTBlCbXc53A9Okpif4RC1MJN06FdwUcHK74tfgKDg7ZzY3d5LQWvlJiEr50OZDoe/WnGr4wQbPe3qnn7WdxcHQpufttCZm1cHfddHgbkHiQisLvijfvQ99I0c4J0s6BAL5iwgbwr8smNmnHgN2cV8NP2OFU6+tE2hD+V40J2102sdtRAoQ5QR2sHPNFCz91T7tKQD34rNlTdS9Xp9pKAhxzsia8NHX3Bm0jAbXhx6jAGY9dZl0CpDnVLPysS4Awp2vAe1HgZ00CLLzAP1XwEps+cgTungGmytcJexZ71d2QLP1goTOYoGV/jmhoFmMf+kItCa5ekkSTHVtZ/vbRdMhCYsfuUCnB1CeSdKjAy8FqK/BDcycEjQNMH7fDJyjcPUBaEukvIJd8aE3lhJCB3JygpEmTJk0a8p/yF1IiKBl1JBDAAAAAAElFTkSuQmCC" alt="restaurant">                            
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Restaurant</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>

                        <!-- sample categorie -->                                      
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADg0lEQVR4nO1ZW0hUQRieLlAPRQUlhGEEPQQ9FUk9BEWhBhWB0UPlOXYhpKKbtZopSSRJRDOn6Cb00oVI86GXkOgyR5eo6KUy2HZnZucYVBQiSq0pXiamZUvcc9xxzy6ejf3gezq78H3//82cf+YAkEUWWUw4KKU5nNFbFiPfOCVfOKMNnPPZIBPAOZ9uUfLWYlSMJGfEL4SYArwOK0y00eL/kW0CXofFCHI0QGkN8Do4I9VOBjilR4HX0cFYgZOBT4zlA68jEAjM5IwOxFefdAkhJoFMAGek3Sb/L0GmgDPit4lQC8gU9Nft/iV8m8RI9tfv6wGZAFFbO3moqnh4tIGB09sHQSagg5CljrtQMJgLvA6L0hrH9wALHQBeR3/93sjo+MTYd+FAJ/AyOu9fWiUqNtuKlxyu3CK6m64sBl4FZ6FjzoNclGFKS9MmYMezCwt1Ex7RMHqsYxTUTfRTN+EPzUQBzUQtJa3w4E58aYHT/y1KWxMZsBh9mHLhUpSGUYNuwkHdRGIsahgN6SZskmZVRggrfqSIhEKhaSkTr5nGNg3DSCLhccSwR8PG3/lezvpW4upHTRCyNjXiMfLpGA7bCSy47xPzThWInOoCUfTgpGM3ZKyiBki9sgFGzrgXb6JiJ/GSc6vWixnlq/8wp6ZozEiVmHCzzLalaoDSRlfiZX4TxUbVQCxO74LtIVUD8szssvrwTqKMFzZWRCNUUyg2OERoJI03zX3j6MDnpMWXtF5eFN1JxrloTSSWXdsjZvnWiBUN++Ke7TIN0R76oNYBRrpdVB+VJyNeUoqXkZpTuc72efP7Z4odIJGkDegmepJstZdf3ytmVawV+TYdkDz3+p7qGvjqogOQp6Ladjzx4qaqgY/JdwCjXhUxiaptx7K2K4oGqJl2A8mwrO2q6hq468IADKfLgE8xQpyR82lfxMnwnPIipofddOBYugw0K2+jtHhCXmQJOKD6IguHgyuBG2gY3kq1gYP+G/dURwnXtxOa38iLnrZSI14zUffZV7cXcUp6FXagLoHxVFcGVMZpZfEYDcUONpzzJZwRw6L0lcXod4vRPmlKfmaSe79FaR1jLM+1+H8mLh53ZwIOxg40E4bS58bWZOIkY1P6HG4EXoD+9GKu6qFe7jbytztb4XzgNWh+I0/D8JC8QpFXKSOvVXQMH+kY7ZdmJ1pnFln8z/gNUABWP1VhA2MAAAAASUVORK5CYII=" alt="bowling">                        </div>
                            <div class="exp_values">
                                <div class="exp_name">Entertainment</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>

                        <!-- sample categorie -->                                      
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD1ElEQVR4nO1X3UtUQRSXoh6K8qF6qx4TNKjc9s6uZl+6c7f17oxpm1YiRLR9ERT1IAZtlpqt4kdUFmVBlNKHWZGBmkVq/0AY1JvQB5UW1FP2cuKMrpXr7p273vYW7cAPlpkzM7/fOefOnpOUlBiJYf3w+XzT7WqeU1F5mUJ5G6H8hUL5Z6Ky7wjxm/IBXBM2bq8jKRCYZjXvpJWUL1JUVq1Q/oaoHAyBsteKyk8q7o0L4058ldu3gKjsAqFsxDDxcCEjhPImm6bNjwt5O+VbFZV9mjLxMLBh4mJFf4y4zeafoVB20XzifGJEzuNd5pLXtFmKyh7KkrC7NFjqXAspNqdAmnMN2LNzpUUolHXgneZ53iD5FFsGLEl3/Aacs+doBkTw7lSfb+aUBRhNG/Q8Et6zPws+vsqCDy+zYPe+1WIOI2EsnXjTlMg7KNtmNIcxZZAsEoehTIH3L7PGouCM4ZvghTGRt2fnzSOUD0U73OlhsPmwFw4258LRdg9UdHmgqG4F+GqWwdd3PwV8ebtKzBXVLYfKzlHbA5c08B32ijOippLKPsX0xIp3PsrBmV4Opa25UNPn+Q3+Zocg23jfIUQg+YZ7o3O4NtG+tDUXMr06Iig7a4g8/jvq/Un5a7UwMogTXRS21I9G4Vfg3IluOukef63Ox03ZiC1HWywvQGXVerlZ3hHu/RAqe1TYddkhUgaBno9EvqbPA+UP9J9YLDvk2AcC07BO0Tsw2Ds5mVgQfOqReVbfYNGoyx+rSpnXIXS5+1gqzHUlw+z1c8IQsplsDfe4A6njNjJ3OmieIpE+vMyIgEjk9QQgkl3JhgQQykp1BRDK7xgREImcjIDZv9hICVD5LRkBA3+rAIWy5xIpJFcqWxIByockIiDXpFgTAf5NX4BcLlrzEascTBeAT2Gsz+iGY2nWCzALJCFgbCQi0PcPpVBljyoqTWxiEKLq7IpcdUazJ/EWgGQi1f24Nhn5aPYk3gJCndfpsc4LgV0YzmEvENa06NiTeAsIeXB4MGO89x0edIZ5eCIi2ZOEgBgjUNViE15Fb1a22HQjEMmeWBUBs0ASAsaGrCfyK9JN835+RXr8I7Cu2AUFVVMXUVCVLs6Ku4AQDh0Pwt3Hz+DctdvgcOfp2qPNmas3xJ5Dx4OG7jJdQHbBNrjZ+USQKdixV3pf/vY90N7TD7e7nkLOpmLrBJQ3nBfkq89dNuzJU01XxN7y+iZrBHiLdwovtj3qhQ1bthsWoBaWQFt3L7Q/7gdW4o+/gPrm68KDZacaDZMP4UiwUZzRcKXFPAGJkRj/2fgBXeJhROOZ8ocAAAAASUVORK5CYII=" alt="underground">
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Transport</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>

                         <!-- sample categorie -->                                      
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADU0lEQVR4nO2WSUwTURzGR4/ePIoXkbjiAUMC6g3lxEWIYFQ4GE3cEjk0GKAsbwokJIAIGOqC7BCWspWCMSZyABXaeYigJmqAWEO9YDjQltJp6WdmishaNmVmYr/kO8xMZvL9/u97L8Mwfv2HwmBWKDj2CSj5AcoWYyhnPyN3YSR3LwbJDXDsMCiLJeZYJyipASVHGTkJILthIpGgpBmU8CuC0xUgc+BYA6gmXOrsDCg5C8qa1w1N14QxSBf+HTkOjti2EX4OlG2QJjwle0DJxy2HpyxgEuqWs08iALZ8W+GpYPJMqvDxGw3pMWZgzpQ5tbI+xANjVrBEAGR8lUBwGG5juubKgh36W76m3yVJeC8A61gy5YF02FuuLwlva7wKjynTxwYmYVIC6BeHcfUmuxeHn66Nh7sv2df0OyQL7wXQhC8PNaO/KYa31ieAf6XyNXkPjCREUgAvBHn5s5cgVaMejUtU264lpXh6alIwN5DhOzxHWEYO6tOlxcWr1DNJ+aXQ6cph7c9Z78jsgYmcYeSi2ER1a1KeFmWNTXDTbMBsBIYfrjb1t8LvBiM3XUhMteZVNqGtvRoYygcmp4Bv/YvDD4IjUYxcFXtXPS0APGrQwWHMBj7rgC8tmHydi/uFaXaA2bXjoQK1VmzUkeoqCBUqqmtDdXMDjC+06NJX4l5BKc6l1274O4FaKyQBOFZkRowqG8ImzqtoFC0AxahycLjEIm+AgKBM0YEnMhFxMR3Rd9SiI+LScCA4489zuQMErGPZAgT+ZTN+gGUyWNzYCTP/Sn4Ai8JWoHCYR1i1XZkV0n5y4VKXA8FlNrBGJ/QTCgLIGHDi4LIjMarFjk6lAJystImhC97zqB9ziTUSrgtHeGUABJfZxBWoG3eJ1xqjEwnPHShWCkBc54w48VM1dmhMm+u/QQ4ALWYXLnc7EPTY23+hQg+GeeUAGOZd9ZVHQrdDrNORpzbUjbnkD1DygRf7nvpmduFeTIe3UsJxKnuA4hFeDBtSYUPtqAsdE25ENnlPoWxOAQCdFjfOt3snLlTn0Pw+OF1rR+t3hewB/YQbWZxTnHxolR2q3lk0mzfWf4McAH47qW8W0e0zm3rHICeArZrxA6wh/wpYJK6QX34xK/QLDO36KnWMAhkAAAAASUVORK5CYII=" alt="charity-donation">                           
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Impromptu</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>

                        <!-- sample categorie -->                                      
                        <div class="each_exp_overview">
                            <div class="exp_icon">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACJElEQVR4nO1XMU/CQBTuxCSJlbhSJ5r4E4zO/gEYlEEG/oI4OgoLrTNdXBlsB1ATjNQJaGBjhcQEaBR2KcuZI5RcoYXeHWkxuS+5NHmXe/m+9+5d3+M4BgYGhr1E+bQcUUStoCS0kSJqwM8qJdRhSdTy8Czq674LIpJhFeSWNZINC/hdUssayoaVh+exBUAifomvCRG1POoLksAhLq8vhz9fwIm8SyZM1NcikuDRmJ3hcJDbs3M7E/gCCMnby0FkEUlsEhzFWSYAAcuAwa6QxopYZq8QJtgzioA9owbBMwo7S/JmTh249UKwt8HhUGzOLoh7IZpuVBHVh112o5JhOfz5AuzpoQicTGyaB6CIZSaCmAcY/uNIqXhco+P77kHsptbk05WpIE0AXHxKBdHLp/nXyxYvjs1Ytv4JzwdcxM6xMpZ5b2wiKmyxQRGBjpSrY+XRVcUSpDEQ5Angk9qc1GHyGfi1xYs/3/gCEDL6XQf034ZAz7VdyXrt275II88jNioBvdcB+PowQf9l4CrAa38pgDDyAmKjy0CuPSdZv+24Z8Bj3/ZFE3l+YaMSQLpsX7Tk+ZS6WwHbamJVAOm1iSK2nQrYVhN7V8SKzzvvKSDsIlYoayD0ItYp/wOhF3GP8j8QehHrlP+BUIq4RDFSro6VJ9LYpCri6+pv4N0oOlbCbpKmDmKZWiOQkXLjPJCt67C/xyKfrk5hK040DzAwMDBwQeAPwo2KChIU4DQAAAAASUVORK5CYII=" alt="categorize">
                            </div>
                            <div class="exp_values">
                                <div class="exp_name">Others</div>
                                <div class="exp_amount">
                                    <span id="currency_option">€</span>0
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- months in overview -->
                    <div class="months-overview">
                        <h3>Spending (Last 12 Months)</h3>
                        <canvas id="monthsBarChart" width="400" height="200"></canvas>
                    </div>                    
                </div>
            </div>
        </section>

        <!-- popup window to add categories -->
        <section>
            <div class="add-expense-popup hidden" id="addExpenseForm">
                <div class="add_expense_div">
                    <button class="closeForm" id="closeExpenseForm">&times;</button>
                    <h3>Add Expense</h3>
                    <form>
                        <label for="category">Category:</label>
                        <select id="category">
                            <!-- important to keep the names as they appear -->
                            <option value="Shopping">Shopping</option>
                            <option value="Health">Health</option>
                            <option value="Rent & Bills">Rent & Bills</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Groceries">Groceries</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Transport">Transport</option>
                            <option value="Impromptu">Impromptu</option>
                            <option value="Others">Others</option>
                        </select>

                        <label for="amount">Budget Amount:</label>
                        <input type="number" id="amount" min="0" required />

                        <label for="amount_left">Spent Amount:</label>
                        <input type="number" id="amount" min="0" required />

                        <label for="cost">Cost Amount:</label>
                        <input type="number" id="amount" min="0" required />

                        <button type="submit" id="submitExpense">Submit</button>
                    </form>
                </div>
            </div>
        </section>
    </main>
</body>
</html>

