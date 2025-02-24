type CountrySchema = {
    [country: string]: {
        [state: string]: string[];
    };
};


export const ALL_COUNTRIES: CountrySchema =
    {
      Nigeria: {
          Abia: [
            "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"
          ],
          Adamawa: [
            "Fufure", "Ganye", "Gayuk", "Gombi", "Grie", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"
          ],
          "Akwa Ibom": [
            "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"
          ],
          Anambra: [
            "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"
          ],
          Bauchi: [
            "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"
          ],
          Bayelsa: [
            "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"
          ],
          Benue: [
            "Apa", "Ado", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"
          ],
          Borno: [
            "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"
          ],
          "Cross River": [
            "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"
          ],
          Delta: [
            "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"
          ],
          Ebonyi: [
              "Afikpo North",
              "Afikpo South",
              "Ebonyi",
              "Ezza North",
              "Ezza South",
              "Ikwo",
              "Ishielu",
              "Ivo",
              "Izzi",
              "Ohaozara",
              "Ohaukwu",
              "Onicha"
          ],
          Edo: [
              "Egor",
              "Esan Central",
              "Esan North-East",
              "Esan South-East",
              "Esan West",
              "Etsako Central",
              "Etsako East",
              "Etsako West",
              "Igueben",
              "Ikpoba Okha",
              "Orhionmwon",
              "Oredo",
              "Ovia North-East",
              "Ovia South-West",
              "Owan East",
              "Owan West",
              "Uhunmwonde"
          ],
          FCT: [
              "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council", "Lugbe", "Abaji", "Gosa", "Keffi", "Karu", "Maitama", "Asokoro", "Guzape", "Wuse", "Wuse II"
          ],
          Lagos: [
              "Ajeromi-Ifelodun",
              "Alimosho",
              "Amuwo-Odofin",
              "Apapa",
              "Badagry",
              "Epe",
              "Eti Osa",
              "Ibeju-Lekki",
              "Ifako-Ijaiye",
              "Ikeja",
              "Ikorodu",
              "Kosofe",
              "Lagos Island",
              "Lagos Mainland",
              "Mushin",
              "Ojo",
              "Oshodi-Isolo",
              "Shomolu",
              "Surulere"
          ],
          Oyo: [
              "Akinyele",
              "Atiba",
              "Atisbo",
              "Egbeda",
              "Ibadan North",
              "Ibadan North-East",
              "Ibadan North-West",
              "Ibadan South-East",
              "Ibadan South-West",
              "Ibarapa Central",
              "Ibarapa East",
              "Ibarapa North",
              "Ido",
              "Irepo",
              "Iseyin",
              "Itesiwaju",
              "Iwajowa",
              "Kajola",
              "Lagelu",
              "Ogbomosho North",
              "Ogbomosho South",
              "Ogo Oluwa",
              "Olorunsogo",
              "Oluyole",
              "Ona Ara",
              "Orelope",
              "Ori Ire",
              "Oyo",
              "Oyo East",
              "Saki East",
              "Saki West",
          ],
          Osun: [
              "Atakunmosa West",
              "Aiyedaade",
              "Aiyedire",
              "Boluwaduro",
              "Boripe",
              "Ede North",
              "Ede South",
              "Ife Central",
              "Ife East",
              "Ife North",
              "Ife South",
              "Egbedore",
              "Ejigbo",
              "Ifedayo",
              "Ifelodun",
              "Ila",
              "Ilesa East",
              "Ilesa West",
              "Irepodun",
              "Irewole",
              "Isokan",
              "Iwo",
              "Obokun",
              "Odo Otin",
              "Ola Oluwa",
              "Olorunda",
              "Oriade",
              "Orolu",
              "Osogbo"
          ],
          Ogun: [
              "Abeokuta South",
              "Ado-Odo/Ota",
              "Egbado North",
              "Egbado South",
              "Ewekoro",
              "Ifo",
              "Ijebu East",
              "Ijebu North",
              "Ijebu North East",
              "Ijebu Ode",
              "Ikenne",
              "Imeko Afon",
              "Ipokia",
              "Obafemi Owode",
              "Odeda",
              "Odogbolu",
              "Ogun Waterside",
              "Remo North",
              "Shagamu"
          ],
          Ondo: [
              "Akoko North-West",
              "Akoko South-West",
              "Akoko South-East",
              "Akure North",
              "Akure South",
              "Ese Odo",
              "Idanre",
              "Ifedore",
              "Ilaje",
              "Ile Oluji/Okeigbo",
              "Irele",
              "Odigbo",
              "Okitipupa",
              "Ondo East",
              "Ondo West",
              "Ose",
              "Owo"
          ],
      },
      "The United States of America": {
        California: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Fresno"],
        Texas: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
        Florida: ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
        "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse"],
        Illinois: ["Chicago", "Aurora", "Naperville", "Joliet", "Springfield"]
      },
      Ghana: {
        "Greater Accra": ["Accra", "Tema", "Teshie", "Madina", "Ashaiman"],
        "Ashanti": ["Kumasi", "Obuasi", "Ejura", "Konongo", "Mampong"],
        "Western": ["Sekondi-Takoradi", "Tarkwa", "Prestea", "Axim", "Bibiani"],
        "Central": ["Cape Coast", "Winneba", "Swedru", "Elmina", "Mankessim"],
        "Northern": ["Tamale", "Yendi", "Savelugu", "Walewale", "Gushegu"]
      }
    }