import {Citizen} from "./citizens";

interface SoftwareProduct {
    name: string;
    quality: number;
    releaseDay: number;
    company: Office;
}

class Blueprint {
    // x/z: horizontal y: vertical
    constructor(public dims: Record<string, number>, public stories: number) {
    }

    get sizePerFloor() {
        return this.dims.x * this.dims.z;
    }

    get totalSize() {
        return this.sizePerFloor * this.stories;
    }

    get maxPplTotal() {
        return Math.floor(this.totalSize / 50);
    }
}

class Building {
    protected administrationEff: number;
    public employed: Array<Citizen>;

    protected constructor(public name: string, public owner: Citizen, public dims: Blueprint, public money: number) {
        this.administrationEff = owner.skill === "administration" ? 1 : 0.75;
        this.employed = [];
    }
}

class Apartment extends Building {
    apartmentsPerFloor: number;
    totalApartments: number;
    renters: Array<Citizen> = [];
    pay: 100;

    constructor(public name: string, public owner: Citizen, public dims: Blueprint, public apartmentSize: number, public rentPerSqft: number, public money: number) {
        super(name, owner, dims, money);
        this.apartmentsPerFloor = this.dims.sizePerFloor / this.apartmentSize / 2;
        // divide by 2 to count for "wasted space"; this includes lobbies, hallways, etc
        this.totalApartments = this.dims.stories * this.apartmentsPerFloor;
        // 2.5 dollars per month for 1 square foot of apartment
        // average apartment 500 sq ft
    }

    get isFull(): boolean {
        return this.totalApartments <= this.renters.length;
    }

    get rentPrice(): number {
        return this.apartmentSize * this.rentPerSqft;
    }

    accept(citizen: Citizen) {
        if (this.renters.length < this.totalApartments) {
            this.renters.push(citizen);
            citizen.residence = this;
        }
    }

    evict(citizen: Citizen) {
        this.renters.splice(this.renters.indexOf(citizen), 1);
    }

    collectRent() {
        for (const citizen of this.renters) {
            citizen.payRent();
        }
    }

    payRent(citizen: Citizen) {
        this.money += this.rentPrice * this.administrationEff;
    }

    changeRent() {
        this.renters.length / this.totalApartments < 0.8 ? this.rentPerSqft *= 0.99 : this.rentPerSqft > 0 ? this.rentPerSqft *= 1.01 : this.rentPerSqft++;
    }

    upgradeApartment() {
        this.dims.dims.x *= 2;
        this.dims.dims.z *= 2;
        this.apartmentsPerFloor = this.dims.sizePerFloor / this.apartmentSize / 2;
        this.totalApartments = this.dims.stories * this.apartmentsPerFloor;
    }

    destroyCompany () {
        for (const tenant of this.renters) {
            this.evict(tenant);
        }
        return true;
    }
}

class Office extends Building {
    // the pinnacle of capitalism
    maxEmployed: number;
    bankruptStart: number | undefined = null;
    currentProduct: SoftwareProduct | undefined = null;

    constructor(public name: string, public owner: Citizen, public dims: Blueprint, public industry: string, public pay: number, public money: number, public foundingDay: number) {
        super(name, owner, dims, money);
        this.maxEmployed = this.dims.maxPplTotal;
        this.employed = [];
    }

    hire(citizen: Citizen) {
        this.employed.push(citizen);
        if (this.currentProduct) {
            this.currentProduct.quality++;
        }
        citizen.occupation = this;
    }

    payCitizens() {
        for (const employee of this.employed) {
            employee.pay(this.pay);
            this.money -= this.pay;
        }
    }

    fireEmployee(employee: Citizen) {
        this.employed.splice(this.employed.indexOf(employee), 1);
        employee.occupation = null;
    }

    destroyCompany () {
        for (const employee of this.employed) {
            this.fireEmployee(employee);
        }
        this.destroyProduct();
        return true;
    }

    checkBankruptcy(day: number) {
        if (this.money < 0 && !this.bankruptStart) {
            this.bankruptStart = day;
        }
        if (this.money > 0) {
            this.bankruptStart = undefined;
        }
        if (day > this.bankruptStart + 365) {
            for (const employee of this.employed) {
                this.fireEmployee(employee);
            }
            return true;
        } else {
            return false;
        }
    }

    changePay() {
        this.pay = this.employed.length / this.maxEmployed > 0.8 || this.money < 0 ? Math.floor(this.pay * 0.99) : Math.ceil(this.pay * 1.01) > 0 ? Math.ceil(this.pay * 1.01) : this.pay + 1;
    }

    developProduct(day: number) {
        if (!this.currentProduct) {
            this.currentProduct = {
                name: `${this.owner.name.split(" ")[1]} Software`,
                quality: 1 + (this.employed.length / (Math.floor(Math.random()) + 2)),
                releaseDay: Math.floor(day + ((2 - (this.employed.length / this.maxEmployed)) * 90)),
                company: this
            }
        }
    }

    releaseProduct(day: number) {
        if (day >= this.currentProduct.releaseDay && day < this.currentProduct.releaseDay + 1) {
            return true;
        }
    }

    destroyProduct() {
        this.currentProduct = undefined;
    }

    sellSoftware(amount: number) {
        this.money += amount;
    }
}

class Farm extends Building {
    plantingDay: number | undefined = undefined;
    bankruptStart: number | undefined = undefined;

    constructor(public name: string, public owner: Citizen, public dims: Blueprint, public pay: number, public money: number) {
        super(name, owner, dims, money);
        this.employed = [];
        this.administrationEff *= (this.employed.length + 1) / this.maxEmployed;
    }

    hire(citizen: Citizen) {
        if (citizen.skill === "farming") {
            this.employed.push(citizen);
            citizen.occupation = this;
            this.administrationEff = (this.owner.skill === "administration" ? 1 : 0.75) * (this.employed.length + 1) / this.maxEmployed;
        }
    }

    get area() {
        // How many square feet does this town take up
        return this.dims.sizePerFloor;
    }

    get maxEmployed() {
        // 2 people per acre
        return (2 * this.area / 43560) + 1;
    }

    get bushelPerSqFt() {
        // How many bushels are in 1 square foot
        return 135 / 43560;
    }

    plantCorn(day: number) {
        if (!this.plantingDay) {
            // To plant 1 acre of corn, it costs around $120
            this.plantingDay = day;
            const totalCost = (this.area / 43560) * 120;
            this.money -= totalCost;
        }
    }

    autoHarvest(day: number) {
        if (day >= this.plantingDay + 80) {
            this.harvestCorn();
        }
    }

    private harvestCorn() {
        // Price of 2 dollar per bushel
        this.money += 2 * 3.46 * this.bushelPerSqFt * this.area * this.employed.length;
        this.money = Number(this.money.toFixed(4));
        this.plantingDay = undefined;
    }

    payCitizens() {
        for (const employee of this.employed) {
            employee.pay(this.pay);
            this.money -= this.pay;
        }
    }

    fireEmployee(employee: Citizen) {
        this.employed.splice(this.employed.indexOf(employee), 1);
        employee.occupation = null;
    }

    checkBankruptcy(day: number) {
        if (this.money < 0) {
            this.bankruptStart = day;
        }
        if (day > this.bankruptStart + 365) {
            for (const employee of this.employed) {
                this.fireEmployee(employee);
            }
            return true;
        } else {
            return false;
        }
    }

    changePay() {
        this.pay = this.employed.length / this.maxEmployed > 0.8 || this.money < 0 ? Math.floor(this.pay * 0.99) : Math.ceil(this.pay * 1.01) > 0 ? Math.ceil(this.pay * 1.01) : this.pay + 1;
    }

    upgradeFarm() {
        if (this.maxEmployed < 50) {
            this.dims.dims.x *= 2;
            this.dims.dims.z *= 2;
        }
    }

    destroyCompany () {
        for (const employee of this.employed) {
            this.fireEmployee(employee);
        }
        return true;
    }
}

export {
    SoftwareProduct,
    Blueprint,
    Building,
    Apartment,
    Office,
    Farm
}
